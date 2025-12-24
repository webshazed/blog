import styles from '@/components/Legal.module.css';

export const metadata = {
    title: 'Accessibility Statement | Kitchen Algo',
    description: 'Our commitment to ensuring digital accessibility for everyone visiting Kitchen Algo.',
};

export default function AccessibilityPage() {
    return (
        <div className={styles.legalPage}>
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>Accessibility Statement</h1>
                    <p className={styles.heroSubtitle}>Last Updated: December 24, 2024</p>
                </div>
            </section>

            <section className={`${styles.content} container`}>
                <div className={styles.textBlock}>
                    <h2>Our Commitment</h2>
                    <p>
                        Kitchen Algo is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
                    </p>

                    <h2>Conformance Status</h2>
                    <p>
                        The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. Kitchen Algo is working towards partial conformance with WCAG 2.1 level AA.
                    </p>

                    <h2>Measures to Support Accessibility</h2>
                    <p>We take the following measures to ensure accessibility:</p>
                    <ul>
                        <li>Include accessibility as part of our internal mission statement.</li>
                        <li>Assign clear accessibility goals and responsibilities.</li>
                        <li>Include people with disabilities in our design personas.</li>
                    </ul>

                    <h2>Feedback</h2>
                    <p>
                        We welcome your feedback on the accessibility of Kitchen Algo. Please let us know if you encounter accessibility barriers on our site:
                    </p>
                    <ul>
                        <li>Email: <strong>accessibility@kitchenalgo.com</strong></li>
                    </ul>
                    <p>We try to respond to feedback within 5 business days.</p>

                    <h2>Technical Specifications</h2>
                    <p>
                        Accessibility of Kitchen Algo relies on the following technologies to work with the particular combination of web browser and any assistive technologies or plugins installed on your computer:
                    </p>
                    <ul>
                        <li>HTML</li>
                        <li>CSS</li>
                        <li>JavaScript</li>
                    </ul>

                    <h2>Assessment Approach</h2>
                    <p>Kitchen Algo assessed the accessibility of the website by self-evaluation.</p>
                </div>
            </section>
        </div>
    );
}
