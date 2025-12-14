"use client";
import { useState, useEffect } from 'react';
import styles from './Comments.module.css';

export default function Comments({ slug }) {
    const [comments, setComments] = useState([]);
    const [formData, setFormData] = useState({ name: '', email: '', content: '' });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (slug) {
            fetch(`/api/comments?slug=${slug}`)
                .then(res => res.json())
                .then(data => {
                    if (data.comments) setComments(data.comments);
                })
                .catch(err => console.error(err));
        }
    }, [slug]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, slug }),
            });
            if (res.ok) {
                const newComment = await res.json();
                setComments([newComment, ...comments]);
                setFormData({ name: '', email: '', content: '' });
                setMsg('Comment posted!');
            } else {
                setMsg('Failed to post comment.');
            }
        } catch (error) {
            setMsg('Error submitting comment.');
        }
        setLoading(false);
    };

    return (
        <div className={styles.commentsSection}>
            <h3 className={styles.heading}>Comments ({comments.length})</h3>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.row}>
                    <input
                        type="text"
                        placeholder="Name *"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className={styles.input}
                    />
                    <input
                        type="email"
                        placeholder="Email (optional)"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className={styles.input}
                    />
                </div>
                <textarea
                    placeholder="Write a comment..."
                    required
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    className={styles.textarea}
                ></textarea>
                <button type="submit" disabled={loading} className={styles.submitBtn}>
                    {loading ? 'Posting...' : 'Post Comment'}
                </button>
                {msg && <p className={styles.msg}>{msg}</p>}
            </form>

            <div className={styles.list}>
                {comments.map(c => (
                    <div key={c.id} className={styles.comment}>
                        <div className={styles.commentHeader}>
                            <strong>{c.name}</strong>
                            <span className={styles.date}>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p>{c.content}</p>
                    </div>
                ))}
                {comments.length === 0 && <p className={styles.empty}>No comments yet. Be the first!</p>}
            </div>
        </div>
    );
}
