const FILE_EXTENSION = '.csg';
const DATE_PATTERN = /\d{4}-\d{2}-\d{2}/;

function slugifyFilename(name) {
  const baseName = (name || 'partie').replace(/\.[^/.]+$/, '');
  const slug = baseName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  const safe = slug || 'partie';
  const date = new Date().toISOString().slice(0, 10);
  const withDate = DATE_PATTERN.test(safe) ? safe : `${safe}-${date}`;
  return `${withDate}${FILE_EXTENSION}`;
}

export function downloadCSG({ filename, payload }) {
  const safeName = slugifyFilename(filename);
  const content = JSON.stringify(payload ?? {});
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
