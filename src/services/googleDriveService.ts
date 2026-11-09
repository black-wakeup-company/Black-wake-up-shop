import { getAccessToken } from './googleAuth';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
}

const BACKUP_FOLDER_NAME = 'BoutiquePro_Sauvegardes';

/**
 * Searches or creates a dedicated folder in user's Google Drive
 */
export async function getOrCreateBackupFolder(accessToken: string): Promise<string> {
  const query = `name = '${BACKUP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

  const response = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Erreur recherche dossier Google Drive: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder if not found
  const createUrl = 'https://www.googleapis.com/drive/v3/files';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    throw new Error('Impossible de créer le dossier de sauvegarde sur Google Drive');
  }

  const newFolder = await createRes.json();
  return newFolder.id;
}

/**
 * Uploads a JSON backup snapshot directly to Google Drive
 */
export async function uploadBackupToDrive(
  jsonData: string,
  customFileName?: string
): Promise<{ fileId: string; fileName: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Non connecté à Google Drive. Veuillez vous connecter d\'abord.');
  }

  const folderId = await getOrCreateBackupFolder(token);

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = customFileName || `sauvegarde_boutiquepro_${dateStr}.json`;

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json',
    description: 'Sauvegarde automatique BoutiquePro'
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' })
  );
  form.append('file', new Blob([jsonData], { type: 'application/json; charset=UTF-8' }));

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Échec de l\'envoi vers Google Drive');
  }

  const result = await uploadRes.json();
  return { fileId: result.id, fileName: result.name };
}

/**
 * Lists available backup files in the BoutiquePro folder or Drive
 */
export async function listDriveBackups(): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const folderId = await getOrCreateBackupFolder(token);
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=20`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (e) {
    console.warn('Erreur listing drive backups:', e);
    return [];
  }
}

/**
 * Downloads a backup file content from Google Drive
 */
export async function downloadDriveBackupContent(fileId: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Connexion Google Drive expirée');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error('Impossible de lire le fichier depuis Google Drive');
  }

  return await res.text();
}
