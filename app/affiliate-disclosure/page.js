import styles from '@/components/Legal.module.css';

export const metadata = {
    title: 'Affiliate Disclosure | Kitchen Algo',
    description: 'Transparency regarding affiliate links and brand partnerships on Kitchen Algo.',
};

export default function AffiliatePage() {
    return (
        <div className={styles.legalPage}>
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>Affiliate Disclosure</h1>
                    <p className={styles.heroSubtitle}>Last Updated: December 24, 2024</p>
                </div>
            </section>

            <section className={`${styles.content} container`}>
                <div className={styles.textBlock}>
                    <h2>Transparency is Our Algorithm</h2>
                    <p>
                        In compliance with the FTC guidelines, please assume that any and all links on Kitchen Algo are affiliate links for which we receive a small commission from sales of certain items.
                    </p>

                    <h2>How it Works</h2>
                    <p>
                        When you click on a link to a product or service mentioned in an article (for example, a link to a specific chef's knife or an Instant Pot on Amazon), and you make a purchase, we may receive a small percentage of the sale as a "referral fee."
                    </p>
                    <div className={styles.alertBox}>
                        <h4>Prices Stay the Same</h4>
                        <p>Using our affiliate links does <strong>not</strong> increase the price you pay. In fact, sometimes we are able to provide unique discount codes through our partnerships.</p>
                    </div>

                    <h2>Amazon Associates Program</h2>
                    <p>
                        Kitchen Algo is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.
                    </p>

                    <h2>Our Editorial Integrity</h2>
                    <p>
                        Our first priority is always providing valuable information and resources to help you master the kitchen. We only recommend products that we have used ourselves, or that we believe will genuinely help our readers.
                    </p>
                    <p>
                        The compensation received will never influence the content, topics, or posts made on this blog. All opinions expressed are our own.
                    </p>

                    <h2>Questions?</h2>
                    <p>If you have any questions about our affiliate partnerships, please feel free to contact us.</p>
                    <p>Email: <strong>partners@kitchenalgo.com</strong></p>
                </div>
            </section>
        </div>
    );
}
