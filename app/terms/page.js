import styles from '@/components/Legal.module.css';

export const metadata = {
    title: 'Terms & Conditions | Kitchen Algo',
    description: 'Terms of Service and website usage rules for Kitchen Algo.',
};

export default function TermsPage() {
    return (
        <div className={styles.legalPage}>
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>Terms & Conditions</h1>
                    <p className={styles.heroSubtitle}>Last Updated: December 24, 2024</p>
                </div>
            </section>

            <section className={`${styles.content} container`}>
                <div className={styles.textBlock}>
                    <p>
                        Welcome to Kitchen Algo. By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
                    </p>

                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        The services that Kitchen Algo provides to you are subject to the following Terms of Use ("TOU"). We reserve the right to update the TOU at any time without notice to you.
                    </p>

                    <h2>2. Description of Services</h2>
                    <p>
                        Kitchen Algo provides you with access to a variety of resources, including recipes, cooking guides, lab reports, and shop information.
                    </p>

                    <h2>3. Use of Content</h2>
                    <p>
                        All content on this site, including text, graphics, logos, and images, is the property of Kitchen Algo or its content suppliers and is protected by international copyright laws.
                    </p>
                    <ul>
                        <li>You may print or download portions of the material for your own non-commercial use.</li>
                        <li>Any other use, including reproduction, modification, or distribution of the content, is strictly prohibited without prior written consent.</li>
                    </ul>

                    <h2>4. User Responsibilities</h2>
                    <p>
                        As a condition of your use of the Services, you will not use the Services for any purpose that is unlawful or prohibited by these terms, conditions, and notices.
                    </p>

                    <h2>5. Limitation of Liability</h2>
                    <p>
                        Kitchen Algo and its contributors shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services or for the cost of procurement of substitute goods.
                    </p>

                    <h2>6. Governing Law</h2>
                    <p>
                        These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the website operator resides, without regard to its conflict of law provisions.
                    </p>

                    <h2>Contact Us</h2>
                    <p>If you have any questions about these Terms, please contact us at:</p>
                    <p>Email: <strong>legal@kitchenalgo.com</strong></p>
                </div>
            </section>
        </div>
    );
}
