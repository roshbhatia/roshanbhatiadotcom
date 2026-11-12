export const PHOSPHOR = {
  background: '#06140d',
  foreground: '#8dffb7',
  dim: '#3d8a5e',
  faint: 'rgba(141, 255, 183, 0.08)',
  font: (size) => `${size}px VT323, "Courier New", monospace`,
};

export function prepareText(context, size, color = PHOSPHOR.foreground) {
  context.font = PHOSPHOR.font(size);
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 8;
  context.textBaseline = 'alphabetic';
  context.textAlign = 'left';
}
