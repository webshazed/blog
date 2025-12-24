import styles from '@/components/Legal.module.css';

export const metadata = {
    title: 'Advertising Policy | Kitchen Algo',
    description: 'Learn about our advertising practices, sponsored content, and how we handle brand collaborations.',
};

export default function AdvertisingPage() {
    return (
        <div className={styles.legalPage}>
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>Advertising Policy</h1>
                    <p className={styles.heroSubtitle}>Last Updated: December 24, 2024</p>
                </div>
            </section>

            <section className={`${styles.content} container`}>
                <div className={styles.textBlock}>
                    <h2>Our Advertising Standards</h2>
                    <p>
                        To provide high-quality food science content for free, Kitchen Algo accepts various forms of cash advertising, sponsorship, and other forms of compensation.
                    </p>

                    <h2>1. Sponsored Content</h2>
                    <p>
                        Any content that has been paid for by a brand or third party will be clearly labeled as "Sponsored" or "In partnership with." We maintain full editorial control over sponsored content to ensure it meets our quality standards and provides value to our readers.
                    </p>

                    <h2>2. AdSense & Display Advertising</h2>
                    <p>
                        We use third-party advertising companies (such as Google AdSense) to serve ads when you visit our website. These companies may use cookies to serve ads based on your prior visits to this or other websites.
                    </p>
                    <ul>
                        <li>Ads should never interfere with your ability to read or navigate the content.</li>
                        <li>We strive to filter out ads that are offensive or irrelevant to the food and kitchen niche.</li>
                    </ul>

                    <h2>3. Data Collection for Ads</h2>
                    <p>
                        Part of our advertising program involves the collection of anonymized data to improve ad targeting. For more details on how this data is handled, please refer to our <a href="/privacy">Privacy Policy</a>.
                    </p>

                    <h2>4. Affiliate Links as Advertising</h2>
                    <p>
                        As mentioned in our <a href="/affiliate-disclosure">Affiliate Disclosure</a>, many of our outgoing links involve commissions. We treat these as a form of performance-based advertising.
                    </p>

                    <h2>Contact for Collaborations</h2>
                    <p>If you are a brand looking to collaborate or advertise with Kitchen Algo, please reach out to our media team.</p>
                    <p>Email: <strong>ads@kitchenalgo.com</strong></p>
                </div>
            </section>
        </div>
    );
}
