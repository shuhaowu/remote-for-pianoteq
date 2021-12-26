function rpc(method, params=[], id=0) {
  const payload = {
    method: method,
    params: params,
    jsonrpc: "2.0",
    id: id
  }

  const resp = await fetch("/jsonrpc", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  })

  console.log("Running JSON RPC ${method}(${params}):")

  if (!resp.ok) {
    const msg = "failed to perform JSON RPC: ${resp.status} ${resp.statusText}";
    console.log(msg);
    throw new Error(msg);
  }

  const data = await resp.json();

  if ("error" in data) {
    const msg = "error while running ${method}: ${data.error.message} (${data.error.code})";
    console.log(msg);
    throw new Error(msg);
  }

  console.log(data);

  return data.result;
}

async function get_all_presets(include_demos = false) {

}

async function load_preset(name) {

}

async function set_sound_output(output_mode) {

}

async function set_reverb(reverb) {

}

async function get_additional_data() {

}
