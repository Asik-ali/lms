import { useCallback, useEffect, useState } from 'react';
import { getTicketReplies } from '../../data/dynamicStore';

export default function useTicketReplies(ticketId) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ ticketId: null, replies: [], loading: false, error: '' });
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (!ticketId) return;
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    setState(previous => ({ ticketId, replies: previous.ticketId === ticketId ? previous.replies : [], loading: true, error: '' }));
    getTicketReplies(ticketId, { signal: controller.signal }).then(replies => {
      if (active) setState({ ticketId, replies, loading: false, error: '' });
    }).catch(() => {
      if (active) setState(previous => ({ ...previous, loading: false, error: controller.signal.aborted ? 'Replies took too long to load. Please retry.' : 'Unable to load replies. Please retry.' }));
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [ticketId, revision]);
  return { ...(state.ticketId === ticketId ? state : { replies: [], loading: Boolean(ticketId), error: '' }), refresh };
}
