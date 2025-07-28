import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface Props {
  token: string;
}

export default function DownloadButton({ token }: Props): JSX.Element {
  const [fileUrl, setFileUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token tidak ditemukan.');
      return;
    }
    fetch('/api/dummy-download?token=' + token)
      .then(res => res.json())
      .then(data => {
        if (data.fileUrl) setFileUrl(data.fileUrl);
        else setError(data.error || 'Token tidak valid.');
      });
  }, [token]);

  if (error) return <p class="text-red-500">{error}</p>;
  if (fileUrl)
    return (
      <a
        href={fileUrl}
        class="px-6 py-3 bg-primary text-white rounded font-bold mt-4"
        download
        target="_blank"
        rel="noopener"
      >
        Download Sekarang
      </a>
    );
  return <p>Memuat link download...</p>;
} 