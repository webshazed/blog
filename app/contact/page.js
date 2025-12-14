import styles from './contact.module.css';

export const metadata = {
    title: 'Contact Us | Evergreen',
    description: 'Get in touch with the Evergreen team. We\'d love to hear from you.',
};

export default function ContactPage() {
    return (
        <div className={styles.contactPage}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>Contact Us</h1>
                    <p className={styles.heroSubtitle}>
                        We'd love to hear from you
                    </p>
                </div>
            </section>

            <section className={`${styles.content} container`}>
                <div className={styles.grid}>
                    {/* Contact Form */}
                    <div className={styles.formSection}>
                        <h2>Send us a message</h2>
                        <form className={styles.form}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="name">Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    required
                                    placeholder="How can we help?"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows="6"
                                    required
                                    placeholder="Your message..."
                                ></textarea>
                            </div>
                            <button type="submit" className={styles.submitBtn}>
                                Send Message
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className={styles.infoSection}>
                        <div className={styles.infoCard}>
                            <h3>Get in Touch</h3>
                            <p>
                                Have a question, suggestion, or just want to say hello?
                                Fill out the form and we'll get back to you as soon as possible.
                            </p>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>📧 Email</h3>
                            <p>hello@evergreen.blog</p>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>🐦 Social</h3>
                            <div className={styles.socialLinks}>
                                <a href="#" className={styles.socialLink}>Twitter</a>
                                <a href="#" className={styles.socialLink}>GitHub</a>
                                <a href="#" className={styles.socialLink}>LinkedIn</a>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>✍️ Write for Us</h3>
                            <p>
                                Interested in contributing? We're always looking for
                                passionate writers. Include your portfolio in your message!
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
