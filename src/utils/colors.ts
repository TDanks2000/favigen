const isColorSupported = process.stdout.isTTY;

/** wrap text in CSI codes if supported */
function wrap(open: number, close: number, text: string): string {
  if (!isColorSupported) return text;
  return `\u001b[${open}m${text}\u001b[${close}m`;
}

export function red(text: string): string {
  return wrap(31, 39, text);
}

export function green(text: string): string {
  return wrap(32, 39, text);
}

export function yellow(text: string): string {
  return wrap(33, 39, text);
}

export function blue(text: string): string {
  return wrap(34, 39, text);
}

export function magenta(text: string): string {
  return wrap(35, 39, text);
}

export function cyan(text: string): string {
  return wrap(36, 39, text);
}

export function white(text: string): string {
  return wrap(37, 39, text);
}

export function gray(text: string): string {
  return wrap(90, 39, text);
}

export function bold(text: string): string {
  return wrap(1, 22, text);
}

export function bgRed(text: string): string {
  return wrap(41, 49, text);
}
