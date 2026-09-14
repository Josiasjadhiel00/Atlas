import JSZip from 'jszip';
import { PYTHON_PROJECT_FILES } from '../data/pythonProjectFiles';

export async function exportProjectAsZip(): Promise<void> {
  const zip = new JSZip();
  const rootFolder = zip.folder('jarvis_assistant');

  if (!rootFolder) {
    throw new Error('No se pudo crear la carpeta raíz del ZIP');
  }

  // Agregar cada archivo del proyecto en su respectiva ruta
  for (const file of PYTHON_PROJECT_FILES) {
    rootFolder.file(file.path, file.code);
  }

  // Generar el archivo blob ZIP
  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9
    }
  });

  // Disparar descarga en el navegador
  const downloadUrl = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = 'jarvis_python_desktop_assistant.zip';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}

export function downloadSingleFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}
