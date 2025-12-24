import styles from '@/components/Legal.module.css';

export const metadata = {
    title: 'DMCA Policy | Kitchen Algo',
    description: 'Our policy regarding copyright infringement and DMCA takedown requests.',
};

export default function DMCAPage() {
    return (
        <div className={styles.legalPage}>
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>DMCA Policy</h1>
                    <p className={styles.heroSubtitle}>Last Updated: December 24, 2024</p>
                </div>
            </section>

            <section className={`${styles.content} container`}>
                <div className={styles.textBlock}>
                    <h2>Copyright Infringement Notification</h2>
                    <p>
                        Kitchen Algo respects the intellectual property rights of others and expects our users to do the same. In accordance with the Digital Millennium Copyright Act (DMCA), we will respond expeditiously to claims of copyright infringement.
                    </p>

                    <h2>1. Filing a Takedown Request</h2>
                    <p>
                        If you are a copyright owner or an agent thereof and believe that any content on our Website infringes upon your copyright, you may submit a notification pursuant to the DMCA by providing our Copyright Agent with the following information in writing:
                    </p>
                    <ul>
                        <li>A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
                        <li>Identification of the copyrighted work claimed to have been infringed.</li>
                        <li>Identification of the material that is claimed to be infringing and information reasonably sufficient to permit us to locate the material (e.g., URL).</li>
                        <li>Your contact information, including your address, telephone number, and an email address.</li>
                        <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
                        <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner.</li>
                    </ul>

                    <h2>2. Counter-Notification</h2>
                    <p>
                        If you believe that your content that was removed is not infringing, or that you have the authorization from the copyright owner, you may send a counter-notice.
                    </p>

                    <h2>3. Repeat Infringer Policy</h2>
                    <p>
                        We reserve the right to terminate access for users who are found to be "repeat infringers" of our copyright policy.
                    </p>

                    <h2>Contact Our Copyright Agent</h2>
                    <p>Please send all DMCA related inquiries to:</p>
                    <p>Email: <strong>dmca@kitchenalgo.com</strong></p>
                </div>
            </section>
        </div>
    );
}
