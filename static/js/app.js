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
  for (let preset_name in data.available_presets) {
    let option = document.createElement("option");
    option.value = preset_name;
    option.text = preset_name;
    ui.select_preset.appendChild(option);
  }
  ui.select_preset.value = data.preset;

  // Build the output mode dropdown.
  ui.select_output_mode.value = data.output_mode;

  // Build the reverb dropdown.
  if (!data.reverb) {
    let unknown_reverb_preset = document.getElementById("unknown-reverb-preset");
    if (!unknown_reverb_preset) {
      unknown_reverb_preset = document.createElement("option");
      unknown_reverb_preset.value = "Unknown/Custom";
      unknown_reverb_preset.text = "Unknown/Custom";
      ui.select_reverb.appendChild(unknown_reverb_preset);
      ui.select_reverb.value = unknown_reverb_preset.value;
    }
  } else {
    ui.select_reverb.value = data.reverb;
  }

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

  ui.metronome_bpm.value = data.metronome.bpm;
  ui.metronome_signature.value = data.metronome.timesig;
  ui.metronome_volume.value = data.metronome.volume_db;
  ui.metronome_accent.checked = data.metronome.accentuate;
  document.metronomeState = data.metronome.enabled;

  set_ui_disabled(ui, false);
}

async function refresh_and_reenable_ui(ui) {
  const data = await pianoteq.get_display_data();
  update_ui(ui, data);
}

function handle_error(ui, error) {
  ui.flash_message.textContent = `${error}. Please reload the page.`;
  ui.flash_box.style.display = "block";
  ui.flash_hr.style.display = "block";
}

async function main() {
  let ui = {
    select_preset: document.getElementById("preset"),
    select_output_mode: document.getElementById("output-mode"),
    select_reverb: document.getElementById("reverb"),

    data_table: document.getElementById("data-table"),
    debug_textfield: document.getElementById("debug"),

    flash_box: document.getElementById("flash"),
    flash_message: document.getElementById("flash-message"),
    flash_hr: document.getElementById("flash-hr"),

    metronome_toggle: document.getElementById("metronome-toggle"),
    metronome_bpm: document.getElementById("metronome"),
    metronome_signature: document.getElementById("metronome-signature"),
    metronome_volume: document.getElementById("metronome-volume"),
    metronome_accent: document.getElementById("metronome-accent"),
  }

  ui.select_preset.addEventListener("change", async function() {
    set_ui_disabled(ui, true);
    await pianoteq.load_preset(this.value, pianoteq_data.available_presets[this.value].bank).then(async(data) => {
      await refresh_and_reenable_ui(ui);
    }).catch((error) => {
      handle_error(ui, error);
    });
  })

  ui.select_output_mode.addEventListener("change", async function() {
    set_ui_disabled(ui, true);
    await pianoteq.set_sound_output(this.value).then(async(data) => {
      await refresh_and_reenable_ui(ui);
    }).catch((error) => {
      handle_error(ui, error);
    });
  })

  ui.select_reverb.addEventListener("change", async function() {
    set_ui_disabled(ui, true);
    await pianoteq.set_reverb(this.value).then(async(data) => {
      await refresh_and_reenable_ui(ui);
    }).catch((error) => {
      handle_error(ui, error);
    });
  })

  const metronome_update = async function() {
    set_ui_disabled(ui, true);
    const bpm = parseInt(ui.metronome_bpm.value);
    const signature = ui.metronome_signature.value;
    const volume = parseInt(ui.metronome_volume.value);
    const accent = ui.metronome_accent.checked;
    await pianoteq.config_metronome(bpm, signature, volume, accent).then(async(data) => {
      await refresh_and_reenable_ui(ui);
    }).catch((error) => {
      handle_error(ui, error);
    });
  }
  ui.metronome_bpm.addEventListener("change", metronome_update);
  ui.metronome_signature.addEventListener("change", metronome_update);
  ui.metronome_volume.addEventListener("change", metronome_update);
  ui.metronome_accent.addEventListener("change", metronome_update);

  ui.metronome_toggle.addEventListener("click", async function() {
    set_ui_disabled(ui, true);
    await pianoteq.set_metronome(!document.metronomeState).then(async(data) => {
      await refresh_and_reenable_ui(ui);
    }).catch((error) => {
      handle_error(ui, error);
    });
  });

  // We wait here as we're finally ready to put the data into the various UI.
  const pianoteq_data = await initial_data_promise.then((data) => {
    update_ui(ui, data);
    return data;
  }).catch((error) => {
    handle_error(ui, error);
  });
}

if (document.readyState != "loading") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}

