import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken
} from '../services/googleAuth';
import {
  uploadBackupToDrive,
  listDriveBackups,
  downloadDriveBackupContent,
  DriveFileItem
} from '../services/googleDriveService';

export function useGoogleDriveBackup(
  getSnapshotData: () => string,
  onRestoreData: (jsonData: string) => boolean,
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void
) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backups, setBackups] = useState<DriveFileItem[]>([]);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('boutiquepro_last_drive_backup');
  });

  // Auto-backup toggle preference
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('boutiquepro_auto_backup_drive') === 'true';
  });

  // Track auth state
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setIsConnected(!!token);
      },
      () => {
        setCurrentUser(null);
        setIsConnected(false);
      }
    );
    return () => unsub();
  }, []);

  const refreshBackupsList = useCallback(async () => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      const items = await listDriveBackups();
      setBackups(items);
    } catch (e: any) {
      console.warn('Erreur chargement sauvegardes:', e);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      refreshBackupsList();
    }
  }, [isConnected, refreshBackupsList]);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setIsConnected(true);
        showToast(`Connecté à Google Drive (${res.user.email})`, 'success');
        const items = await listDriveBackups();
        setBackups(items);
      }
    } catch (err: any) {
      showToast(err.message || 'Échec de connexion à Google', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setIsConnected(false);
    setBackups([]);
    showToast('Déconnecté de Google Drive', 'info');
  };

  // Perform a backup right now
  const triggerManualBackup = async () => {
    if (!isConnected) {
      showToast('Veuillez d\'abord connecter votre compte Google Drive', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const data = getSnapshotData();
      const res = await uploadBackupToDrive(data);
      const now = new Date().toISOString();
      setLastBackupTime(now);
      localStorage.setItem('boutiquepro_last_drive_backup', now);
      showToast(`Sauvegarde réussie dans Google Drive : ${res.fileName}`, 'success');
      await refreshBackupsList();
    } catch (e: any) {
      showToast(e.message || 'Erreur lors de la sauvegarde Google Drive', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Restore from a specific backup
  const triggerRestore = async (file: DriveFileItem) => {
    const confirm = window.confirm(
      `Confirmez-vous la restauration de la sauvegarde "${file.name}" ? Toutes les données actuelles seront remplacées par cette version.`
    );
    if (!confirm) return;

    setIsLoading(true);
    try {
      const jsonContent = await downloadDriveBackupContent(file.id);
      const success = onRestoreData(jsonContent);
      if (success) {
        showToast(`Données restaurées depuis "${file.name}" avec succès !`, 'success');
      }
    } catch (e: any) {
      showToast(e.message || 'Échec de la restauration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutoBackup = (enabled: boolean) => {
    setAutoBackupEnabled(enabled);
    localStorage.setItem('boutiquepro_auto_backup_drive', enabled ? 'true' : 'false');
    showToast(
      enabled
        ? 'Sauvegarde automatique Google Drive activée (toutes les heures)'
        : 'Sauvegarde automatique désactivée',
      'info'
    );
  };

  // Background Auto-backup timer (runs every 60 minutes if enabled & connected)
  useEffect(() => {
    if (!autoBackupEnabled || !isConnected) return;

    const interval = setInterval(async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          const data = getSnapshotData();
          await uploadBackupToDrive(data);
          const now = new Date().toISOString();
          setLastBackupTime(now);
          localStorage.setItem('boutiquepro_last_drive_backup', now);
          console.info('Auto-backup to Google Drive succeeded at', now);
        }
      } catch (e) {
        console.warn('Auto-backup background error:', e);
      }
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [autoBackupEnabled, isConnected, getSnapshotData]);

  return {
    currentUser,
    isConnected,
    isLoading,
    backups,
    lastBackupTime,
    autoBackupEnabled,
    handleConnect,
    handleDisconnect,
    triggerManualBackup,
    triggerRestore,
    toggleAutoBackup,
    refreshBackupsList
  };
}
