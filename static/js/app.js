import * as pianoteq from './pianoteq.js'

// We want to load all the states before the DOM finish loading to make the
// page load as fast as possible.
const initial_data_promise = pianoteq.get_display_data();


function set_ui_disabled(ui, disabled) {
  for (let [_, element] of Object.entries(ui)) {
    element.disabled = disabled;
  }
}


function update_ui(ui, data) {
  // Build the preset drop down.
  ui.select_preset.innerHTML = "";
  for (let i in data.available_presets) {
    let preset = data.available_presets[i];
    let option = document.createElement("option");
    option.value = preset;
    option.text = preset;
    ui.select_preset.appendChild(option);
  }
  ui.select_preset.value = data.preset;

  // Build the output mode dropdown.
  ui.select_output_mode.value = data.output_mode;

  // Build the data table
  ui.data_table.innerHTML = "";
  for (let i in data.data_table) {
    let row = data.data_table[i];
    let tr = document.createElement("tr");
    let td1 = document.createElement("td");
    let td2 = document.createElement("td");

    td1.textContent = row[0];
    td2.textContent = row[1];

    tr.appendChild(td1);
    tr.appendChild(td2);

    ui.data_table.appendChild(tr);
  }

  set_ui_disabled(ui, false);
}

async function refresh_and_reenable_ui(ui) {
  const data = await pianoteq.get_display_data();
  update_ui(ui, data);
}

async function main() {
  let ui = {
    btn_undo: document.getElementById("undo"),
    btn_redo: document.getElementById("redo"),

    select_preset: document.getElementById("preset"),
    select_output_mode: document.getElementById("output-mode"),

    data_table: document.getElementById("data-table"),
    debug_textfield: document.getElementById("debug"),
  }

  ui.select_preset.addEventListener("change", async function() {
    set_ui_disabled(ui, true);
    await pianoteq.load_preset(this.value);
    await refresh_and_reenable_ui(ui);
  })

  ui.select_output_mode.addEventListener("change", async function() {
    set_ui_disabled(ui, true);
    await pianoteq.set_sound_output(this.value);
    await refresh_and_reenable_ui(ui);
  })

  // We wait here as we're finally ready to put the data into the various UI.
  const data = await initial_data_promise;
  update_ui(ui, data);
}

if (document.readyState != "loading") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}

