import styles from '@/components/Legal.module.css';

export const metadata = {
    title: 'Cookie Policy | Kitchen Algo',
    description: 'Learn about how we use cookies and tracking technologies to improve your experience on Kitchen Algo.',
};

export default function CookiePage() {
    return (
        <div className={styles.legalPage}>
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>Cookie Policy</h1>
                    <p className={styles.heroSubtitle}>Last Updated: December 24, 2024</p>
                </div>
            </section>

            <section className={`${styles.content} container`}>
                <div className={styles.textBlock}>
                    <h2>What Are Cookies?</h2>
                    <p>
                        Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, as well as to provide information to the owners of the site.
                    </p>

                    <h2>1. How We Use Cookies</h2>
                    <p>Kitchen Algo uses cookies for several reasons:</p>
                    <ul>
                        <li><strong>Essential Cookies:</strong> These are necessary for the website to function properly.</li>
                        <li><strong>Performance Cookies:</strong> These help us understand how visitors interact with our site by collecting and reporting information anonymously.</li>
                        <li><strong>Functional Cookies:</strong> These allow the site to remember choices you make (such as your username or language).</li>
                        <li><strong>Targeting/Advertising Cookies:</strong> These are used to deliver ads more relevant to you and your interests.</li>
                    </ul>

                    <h2>2. Third-Party Cookies</h2>
                    <p>
                        In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Site, deliver advertisements on and through the Site, and so on. These include Google Analytics, Google AdSense, and social media platforms.
                    </p>

                    <h2>3. Your Choices Regarding Cookies</h2>
                    <p>
                        If you prefer to avoid the use of cookies on the Site, you must first disable the use of cookies in your browser and then delete the cookies saved in your browser associated with this website. You may use this option for preventing the use of cookies at any time.
                    </p>

                    <h2>4. Updates to This Policy</h2>
                    <p>
                        We may update our Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons.
                    </p>

                    <h2>Contact Us</h2>
                    <p>For more information about our use of cookies, please contact us.</p>
                    <p>Email: <strong>privacy@kitchenalgo.com</strong></p>
                </div>
            </section>
        </div>
    );
}
