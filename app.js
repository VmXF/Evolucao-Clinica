"use strict";

const examOptions = {
  "Geral": ["BEG", "REG", "MEG", "Lúcido e orientado", "Corado", "Hipocorado", "Hidratado", "Desidratado"],
  "Cardiovascular": ["RCR em 2T, BNF, sem sopros", "RCR em 2T, com sopro", "Perfusão periférica preservada", "TEC preservado"],
  "Respiratório": ["MVUA, sem RA", "MV diminuído", "Estertores crepitantes", "Sibilos", "Roncos"],
  "Abdome": ["Abd normal: plano, flácido, indolor, não palpo massas ou VMG", "Ascite +", "Globoso", "Distendido", "Dor à palpação", "RHA presentes", "RHA diminuídos", "RHA aumentados", "RHA ausentes"],
  "Neurológico": ["Sem déficits focais", "Pupilas isocóricas e fotorreagentes", "Déficit motor", "Alteração do nível de consciência"],
  "Extremidades": ["Sem edema", "Edema periférico", "Panturrilhas livres", "Sinais de TVP"]
};
const form = document.querySelector("#noteForm");
const output = document.querySelector("#output");
const pendingItems = document.querySelector("#pendingItems");
const value = name => form.elements[name].value.trim();
const textLine = (label, name) => value(name) ? `${label}: ${value(name)}` : "";

function renderExamOptions() {
  document.querySelector("#examGroups").innerHTML = Object.entries(examOptions).map(([group, options]) => `
    <div class="exam-group"><h3>${group}</h3>${options.map((option, index) => `
      <label class="option"><input type="checkbox" name="exam" value="${option}" data-group="${group}" aria-label="${option}"><span>${option}</span></label>`).join("")}
    </div>`).join("");
}

function addPending(text = "") {
  const row = document.createElement("div");
  row.className = "pending-row";
  row.innerHTML = `<input type="checkbox" aria-label="Incluir pendência"><input type="text" aria-label="Descrição da pendência" placeholder="Descrever pendência" value="${text.replace(/"/g, "&quot;")}"><button class="remove" type="button" aria-label="Remover pendência">×</button>`;
  row.querySelector(".remove").addEventListener("click", () => row.remove());
  pendingItems.append(row);
}

function rangeLine(label, unit, maxName, minName) {
  const max = value(maxName), min = value(minName);
  if (!max && !min) return "";
  const parts = [];
  if (max) parts.push(`máx ${max}`);
  if (min) parts.push(`mín ${min}`);
  return `${label}: ${parts.join("; ")}${unit ? ` ${unit}` : ""}`;
}

function section(title, lines) {
  const entries = lines.filter(Boolean);
  return entries.length ? `${title}\n${entries.join("\n")}` : "";
}

function generateNote() {
  const header = [textLine("# Dia de internação", "diaInternacao"), textLine("# Diagnósticos", "diagnosticos"), textLine("# Alergias", "alergias"), textLine("# HPP", "hpp"), textLine("# Medicações de uso contínuo", "medicacoesUso"), value("hda") ? `HDA:\n${value("hda")}` : ""].filter(Boolean).join("\n");
  const vitals = [rangeLine("PAS", "mmHg", "pasMax", "pasMin"), rangeLine("PAD", "mmHg", "padMax", "padMin"), rangeLine("FC", "bpm", "fcMax", "fcMin"), rangeLine("SpO₂", "%", "spo2Max", "spo2Min"), rangeLine("Temperatura", "°C", "tempMax", "tempMin")];
  const last24 = section("ÚLTIMAS 24 HORAS", [...vitals, textLine("Débito urinário", "debitoUrinario"), textLine("Drenos", "drenos"), textLine("Outros débitos", "outrosDebitos"), textLine("Intercorrências", "intercorrencias"), textLine("Queixas / evolução subjetiva", "subjetivo")]);
  const grouped = {};
  document.querySelectorAll('input[name="exam"]:checked').forEach(input => (grouped[input.dataset.group] ||= []).push(input.value));
  if (value("glasgow")) (grouped["Neurológico"] ||= []).push(`Glasgow ${value("glasgow")}`);
  const exam = section("EXAME FÍSICO", Object.entries(grouped).map(([group, findings]) => `${group}: ${findings.join("; ")}`));
  const complementary = section("EXAMES COMPLEMENTARES", [textLine("Laboratoriais", "laboratoriais"), textLine("Imagem", "imagem")]);
  const impression = section("IMPRESSÃO", [value("impressao")]);
  const pending = [...pendingItems.querySelectorAll(".pending-row")].filter(row => row.querySelector('input[type="checkbox"]').checked).map(row => row.querySelector('input[type="text"]').value.trim()).filter(Boolean);
  const pendingSection = section("PENDÊNCIAS", pending.map(item => `- ${item}`));
  output.value = [header, last24, exam, complementary, impression, pendingSection].filter(Boolean).join("\n\n");
  document.querySelector("#copyButton").disabled = !output.value;
}

renderExamOptions();
addPending();
document.querySelector("#addPending").addEventListener("click", () => addPending());
form.addEventListener("submit", event => { event.preventDefault(); generateNote(); output.scrollIntoView({ behavior: "smooth", block: "start" }); });
document.querySelector("#clearButton").addEventListener("click", () => { form.reset(); pendingItems.replaceChildren(); addPending(); output.value = ""; document.querySelector("#copyButton").disabled = true; });
document.querySelector("#copyButton").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(output.value); }
  catch { output.focus(); output.select(); document.execCommand("copy"); }
  const button = document.querySelector("#copyButton"); const original = button.textContent; button.textContent = "Copiado"; setTimeout(() => button.textContent = original, 1600);
});
let installPrompt;
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); installPrompt = event; document.querySelector("#installButton").classList.remove("hidden"); });
document.querySelector("#installButton").addEventListener("click", async () => { if (installPrompt) { await installPrompt.prompt(); installPrompt = null; } });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
