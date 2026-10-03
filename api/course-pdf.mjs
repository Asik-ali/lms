import { createServiceClient, getAuthedUser, setCors } from './_auth.mjs';

const CHUNK_SIZE = 1024 * 1024;
const MAX_FILE_SIZE = 32 * CHUNK_SIZE;

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges');
  try {
    const supabase = createServiceClient();
    const profile = await getAuthedUser(req, supabase);
    if (!profile) return res.status(401).json({ error: 'Please sign in to view this PDF.' });
    const fileId = String(req.query?.fileId || '');
    if (!/^\d+$/.test(fileId)) return res.status(400).json({ error: 'Invalid PDF' });
    const { data: file, error: fileError } = await supabase.from('course_pdfs').select('course_id, pdf_url').eq('id', fileId).single();
    if (fileError || !file) return res.status(404).json({ error: 'PDF not found' });
    const { data: course, error: courseError } = await supabase.from('courses').select('title').eq('id', file.course_id).single();
    if (courseError || !course) return res.status(404).json({ error: 'Course not found' });
    const access = String(profile.course || '').split(',').map(name => name.trim().toLowerCase());
    if (profile.role !== 'admin' && !access.includes(course.title.trim().toLowerCase())) {
      return res.status(403).json({ error: 'You do not have access to this course.' });
    }
    const link = new URL(file.pdf_url);
    const drive = link.hostname === 'drive.google.com' || link.hostname === 'docs.google.com';
    const storageHost = new URL(process.env.VITE_SUPABASE_URL).hostname;
    const storage = link.protocol === 'https:' && link.hostname === storageHost && link.pathname.startsWith('/storage/v1/object/');
    if (!drive && !storage) return res.status(400).json({ error: 'Use a Drive or Supabase Storage PDF link for protected viewing.' });
    const driveId = link.pathname.match(/\/d\/([\w-]+)/)?.[1] || link.searchParams.get('id');
    if (drive && (!driveId || !/^[\w-]+$/.test(driveId))) return res.status(400).json({ error: 'Invalid Drive PDF link' });
    const range = String(req.headers?.range || `bytes=0-${CHUNK_SIZE - 1}`).match(/^bytes=(\d+)-(\d+)$/);
    if (!range) return res.status(416).json({ error: 'Invalid PDF range' });
    const start = Number(range[1]);
    const end = Number(range[2]);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end < start || end - start >= CHUNK_SIZE || end >= MAX_FILE_SIZE) {
      return res.status(416).json({ error: 'Invalid PDF range' });
    }
    let target = drive ? `https://drive.usercontent.google.com/download?id=${encodeURIComponent(driveId)}&export=download` : link.href;
    let upstream;
    for (let redirect = 0; redirect < 5; redirect++) {
      upstream = await fetch(target, { redirect: 'manual', headers: { Range: `bytes=${start}-${end}` }, signal: AbortSignal.timeout(20000) });
      if (![301, 302, 303, 307, 308].includes(upstream.status)) break;
      const location = upstream.headers.get('location');
      await upstream.body?.cancel();
      if (!location) throw new Error('PDF redirect failed');
      const next = new URL(location, target);
      if (next.protocol !== 'https:' || !(next.hostname === 'drive.google.com' || next.hostname === 'drive.usercontent.google.com' || next.hostname.endsWith('.googleusercontent.com'))) {
        throw new Error('The Drive PDF is not publicly readable. Ask the administrator to enable viewing.');
      }
      target = next.href;
    }
    if (!upstream?.ok) throw new Error('The PDF could not be loaded from Drive.');
    const chunks = [];
    let size = 0;
    for await (const chunk of upstream.body) {
      size += chunk.length;
      if (size > MAX_FILE_SIZE) throw new Error('This PDF exceeds the 32 MB viewer limit.');
      chunks.push(Buffer.from(chunk));
    }
    const bytes = Buffer.concat(chunks);
    const contentRange = upstream.headers.get('content-range');
    const parsedRange = contentRange?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
    const total = parsedRange ? Number(parsedRange[3]) : bytes.length;
    if (total > MAX_FILE_SIZE || !total) throw new Error('This PDF exceeds the 32 MB viewer limit.');
    if (start === 0 && !bytes.subarray(0, 1024).includes(Buffer.from('%PDF-'))) {
      throw new Error('Drive returned a permission page instead of a PDF. Ask the administrator to allow viewing.');
    }
    if (start >= total) return res.status(416).json({ error: 'PDF range is outside the file' });
    const output = parsedRange ? bytes : bytes.subarray(start, Math.min(end + 1, total));
    if (parsedRange && Number(parsedRange[1]) !== start) throw new Error('PDF range did not match');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Range', `bytes ${start}-${start + output.length - 1}/${total}`);
    return res.status(206).send(output);
  } catch (error) {
    return res.status(502).json({ error: error.message || 'Unable to load PDF' });
  }
}
