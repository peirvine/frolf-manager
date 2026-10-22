import { useEffect, useState } from 'react'
import { Alert, Button, Skeleton, Snackbar } from '@mui/material'
import { getFeedback, deleteFeedback } from '../../firebase'

const KIND_LABELS = { bug: 'Something wrong', idea: 'Idea', other: 'Other' }

// What people sent from the FAQ page, newest first
export default function FeedbackManager () {
  const [items, setItems] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => { getFeedback().then(list => setItems(list.sort((a, b) => b.createdAt - a.createdAt))) }, [])

  const remove = async (id) => {
    const res = await deleteFeedback(id)
    if (res.code === "success") setItems(current => current.filter(item => item.id !== id))
    else setNotice(res)
  }

  if (!items) return <section className="manageCard"><Skeleton variant="rounded" animation="wave" height={60} /></section>

  return (
    <>
      <Snackbar open={Boolean(notice)} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice && <Alert severity={notice.code} onClose={() => setNotice(null)}>{notice.message}</Alert>}
      </Snackbar>
      <section className="manageCard">
        <h3>Feedback</h3>
        {items.length === 0 && <p>Nothing yet.</p>}
        {items.map(item => (
          <div key={item.id} style={{ borderTop: '1px solid #e3e8ef', padding: '12px 0' }}>
            <strong>{KIND_LABELS[item.kind] || 'Other'}</strong> · {item.name || 'Unknown'}{item.email && ` (${item.email})`} · {new Date(item.createdAt).toLocaleString()}{item.page && ` · ${item.page}`}
            <p style={{ whiteSpace: 'pre-wrap', margin: '6px 0' }}>{item.message}</p>
            <Button size="small" color="error" onClick={() => remove(item.id)}>Delete</Button>
          </div>
        ))}
      </section>
    </>
  )
}
