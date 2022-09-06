const fromCharCode = String.fromCharCode;
export function uint8ArrayToBase64(uint8array: Uint8Array) {
  var output = [];

  for (var i = 0, length = uint8array.length; i < length; i++) {
    output.push(fromCharCode(uint8array[i]));
  }

  return window.btoa(output.join(""));
}

function asCharCode(c: string) {
  return c.charCodeAt(0);
}

export function base64ToUint8Array(chars: string) {
  return Uint8Array.from(window.atob(chars), asCharCode);
}
