import styles from '@/components/Legal.module.css';

export const metadata = {
    title: 'Privacy Policy | Kitchen Algo',
    description: 'Privacy Policy for Kitchen Algo. Learn how we collect, use, and protect your personal data in compliance with GDPR and CCPA.',
};

export default function PrivacyPage() {
    return (
        <div className={styles.legalPage}>
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>Privacy Policy</h1>
                    <p className={styles.heroSubtitle}>Last Updated: December 24, 2024</p>
                </div>
            </section>

            <section className={`${styles.content} container`}>
                <div className={styles.textBlock}>
                    <p>
                        At Kitchen Algo ("we," "our," or "us"), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website kitchenalgo.com.
                    </p>

                    <h2>1. Information We Collect</h2>
                    <p>We may collect information about you in a variety of ways, including:</p>
                    <ul>
                        <li><strong>Personal Data:</strong> Personally identifiable information, such as your name and email address, that you voluntarily give to us when you subscribe to our newsletter or contact us.</li>
                        <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, and your access times.</li>
                        <li><strong>Cookies and Web Beacons:</strong> We use cookies to improve your experience. See our <a href="/cookies">Cookie Policy</a> for more details.</li>
                    </ul>

                    <h2>2. Use of Your Information</h2>
                    <p>We use the information we collect to:</p>
                    <ul>
                        <li>Operate and maintain the website.</li>
                        <li>Improve your experience and personalize content (e.g., recipe recommendations).</li>
                        <li>Send you newsletters and marketing communications.</li>
                        <li>Respond to your comments and questions.</li>
                    </ul>

                    <h2>3. Disclosure of Your Information</h2>
                    <p>We do not sell your personal information. We may share information we have collected about you in certain situations, such as with third-party service providers (hosting, email) or advertising partners (Google AdSense). These partners are required to protect your data.</p>

                    <h2>4. GDPR & CCPA Rights</h2>
                    <p>
                        We respect your rights under the GDPR and CCPA. You have the right to access, rectify, or erase your personal data at any time. For California residents, we do not sell your personal data.
                    </p>

                    <h2>Contact Us</h2>
                    <p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
                    <p>Email: <strong>privacy@kitchenalgo.com</strong></p>
                </div>
            </section>
        </div>
    );
}
