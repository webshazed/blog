import styles from '@/components/Legal.module.css';

export const metadata = {
    title: 'Disclaimer | Kitchen Algo',
    description: 'Health, nutrition, and safety disclaimers for Kitchen Algo. Read our policies regarding food allergies and recipe accuracy.',
};

export default function DisclaimerPage() {
    return (
        <div className={styles.legalPage}>
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>Legal Disclaimer</h1>
                    <p className={styles.heroSubtitle}>Last Updated: December 24, 2024</p>
                </div>
            </section>

            <section className={`${styles.content} container`}>
                <div className={styles.textBlock}>
                    <div className={styles.alertBox}>
                        <h4>⚠️ Important Medical Notice</h4>
                        <p>The information on Kitchen Algo is for educational and entertainment purposes only. We are not medical professionals or certified nutritionists.</p>
                    </div>

                    <h2>1. Dietary & Nutrition Disclaimer</h2>
                    <p>
                        Any nutritional information provided on Kitchen Algo (such as calories, fat, or carbohydrates) is an estimate only. These estimates are typically calculated using third-party software and can vary significantly based on specific brands of ingredients or cooking methods used.
                    </p>
                    <p>
                        We do not guarantee the accuracy of any nutritional information. If you require precise nutritional data for medical reasons, you should consult with a doctor or a registered dietitian.
                    </p>

                    <h2>2. Food Allergy Responsibility</h2>
                    <p>
                        It is the user's responsibility to review the ingredient list of any recipe to ensure it does not contain substances to which they, or anyone they are cooking for, may be allergic.
                    </p>
                    <p>
                        While we may label certain recipes as "Gluten-Free" or "Nut-Free," we cannot guarantee that cross-contamination hasn't occurred in your kitchen or at the manufacturer level. Always verify labels.
                    </p>

                    <h2>3. Kitchen Safety & Liability</h2>
                    <p>
                        Cooking involves inherent risks, including but not limited to burns, cuts, and food-borne illnesses. By using our recipes and guides, you assume all risks associated with your kitchen activities.
                    </p>
                    <ul>
                        <li><strong>Equipment usage:</strong> Always follow the manufacturer's safety instructions for appliances like Instant Pots, Air Fryers, and knives.</li>
                        <li><strong>Food safety:</strong> Ensure all meat and dairy products are cooked to the recommended internal temperatures to prevent illness.</li>
                    </ul>
                    <p>
                        Kitchen Algo and its authors shall not be held liable for any injuries, losses, or damages incurred while following the advice or recipes on this site.
                    </p>

                    <h2>4. Recipe Accuracy</h2>
                    <p>
                        We strive to provide accurate recipes and cooking guides. However, variables such as altitude, kitchen temperature, and individual appliance calibrations can affect the final result. We make no guarantees that every recipe will produce the intended result for every user.
                    </p>

                    <h2>5. External Links</h2>
                    <p>
                        This website may contain links to external sites that are not provided or maintained by or in any way affiliated with Kitchen Algo. Please note that we do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.
                    </p>

                    <h2>Contact Us</h2>
                    <p>If you have any questions regarding this disclaimer, please contact us at:</p>
                    <p>Email: <strong>legal@kitchenalgo.com</strong></p>
                </div>
            </section>
        </div>
    );
}
