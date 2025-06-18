const decoder = new TextDecoder("utf8");
const encoder = new TextEncoder();
export function buf2str(a: ArrayBuffer) {
  return decoder.decode(a);
}

export function str2buf(a: string): ArrayBuffer {
  return encoder.encode(a);
}

export function arr2buf(array: Uint8Array): ArrayBuffer {
  return array.buffer.slice(
    array.byteOffset,
    array.byteLength + array.byteOffset
  );
}
