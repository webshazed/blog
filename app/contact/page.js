import styles from './contact.module.css';

export const metadata = {
    title: 'Contact Us | Kitchen Algo',
    description: 'Get in touch with the Kitchen Algo team. Suggest a recipe, report a kitchen bug, or ask a science question.',
};

export default function ContactPage() {
    return (
        <div className={styles.contactPage}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>Contact the Lab</h1>
                    <p className={styles.heroSubtitle}>
                        Your direct line to culinary efficiency
                    </p>
                </div>
            </section>

            <section className={`${styles.content} container`}>
                <div className={styles.grid}>
                    {/* Contact Form */}
                    <div className={styles.formSection}>
                        <h2>Send us a message</h2>
                        <p className={styles.formIntro}>Use the form below for recipe questions, bug reports, or general inquiries. We aim to respond within 48 hours.</p>
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
                                <select id="subject" name="subject" required className={styles.select}>
                                    <option value="">Select a subject...</option>
                                    <option value="recipe">Recipe Question</option>
                                    <option value="science">Food Science Inquiry</option>
                                    <option value="bug">Report a Kitchen Bug</option>
                                    <option value="business">Business / Partnership</option>
                                    <option value="dmca">DMCA / Copyright</option>
                                    <option value="other">Other</option>
                                </select>
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
                                Submit to Lab
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className={styles.infoSection}>
                        <div className={styles.infoCard}>
                            <h3>📍 Business Information</h3>
                            <p><strong>Kitchen Algo Media Group</strong></p>
                            <p>Science-Driven Content Development</p>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>📧 Dedicated Channels</h3>
                            <ul className={styles.emailList}>
                                <li><strong>General:</strong> hello@kitchenalgo.com</li>
                                <li><strong>Business:</strong> ads@kitchenalgo.com</li>
                                <li><strong>Legal:</strong> legal@kitchenalgo.com</li>
                            </ul>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>🐦 Connect With Us</h3>
                            <div className={styles.socialLinks}>
                                <a href="https://instagram.com/kitchenalgo" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>Instagram</a>
                                <a href="https://facebook.com/kitchenalgorithm" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>Facebook</a>
                                <a href="https://pinterest.com/kitchenalgo" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>Pinterest</a>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>💡 Partnership Opportunities</h3>
                            <p>
                                Are you a food scientist or gear manufacturer? We're always looking
                                for data-backed collaborations. Please use the "Business" subject in the form.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
