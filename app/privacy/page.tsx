import Footer from '../components/Footer'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#F5F3EE' }}>
      <nav style={{ background:'white', borderBottom:'1px solid rgba(0,0,0,0.07)', padding:'0 24px', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <a href="/">
          <img src="/rating-bee.png" alt="RatingBee" style={{ height:'28px', width:'auto' }} />
        </a>
        <a href="/" style={{ fontSize:'14px', color:'#555', textDecoration:'none' }}>← Back to home</a>
      </nav>

      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'48px 24px 80px' }}>
        <h1 style={{ fontSize:'2rem', fontWeight:'700', color:'#1A1A1A', fontFamily:'Georgia, serif', marginBottom:'8px' }}>Privacy Policy</h1>
        <p style={{ fontSize:'14px', color:'#888', marginBottom:'40px' }}>Last updated: April 2026</p>

        {[
          {
            title: '1. Information We Collect',
            body: 'We collect information you provide directly to us, such as your name, email address, and password when you create an account. We also collect information about your use of RatingBee, including reviews you write, businesses you interact with, and votes you cast. When you claim a business listing, we collect your business phone number for verification purposes.'
          },
          {
            title: '2. How We Use Your Information',
            body: 'We use the information we collect to operate and improve RatingBee, to verify your identity when you claim a business listing, to send you service-related communications, to display your reviews and profile information on the platform, and to analyze usage patterns to improve our services. We do not sell your personal information to third parties.'
          },
          {
            title: '3. Information We Share',
            body: 'Your reviews, ratings, and public profile information are visible to other RatingBee users. When you claim a business listing, your business name and verified status are displayed publicly. We may share information with service providers who help us operate RatingBee, including Supabase for database hosting and Go High Level for SMS verification. We may also share information when required by law.'
          },
          {
            title: '4. Third-Party Services',
            body: 'RatingBee integrates with Google Places API and TripAdvisor to display business information and reviews. Your use of RatingBee is subject to the privacy policies of these third-party services. We display their data but do not share your personal information with them without your consent.'
          },
          {
            title: '5. Cookies and Tracking',
            body: 'We use cookies and similar technologies to maintain your session when you are logged in, to remember your location preferences, and to analyze how our platform is used. You can control cookies through your browser settings, but disabling cookies may affect your ability to use certain features of RatingBee.'
          },
          {
            title: '6. Data Retention',
            body: 'We retain your account information for as long as your account is active or as needed to provide you with our services. You may delete your account at any time through your account settings. Reviews you have posted may remain on the platform after account deletion in an anonymized form.'
          },
          {
            title: '7. Security',
            body: 'We take reasonable measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. Your password is encrypted and never stored in plain text. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.'
          },
          {
            title: '8. Your Rights',
            body: 'You have the right to access, update, or delete your personal information at any time through your account settings. You may also request a copy of the personal data we hold about you by contacting us. California residents have additional rights under the CCPA, including the right to know what personal information we collect and the right to opt out of the sale of personal information (we do not sell personal information).'
          },
          {
            title: '9. Children\'s Privacy',
            body: 'RatingBee is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.'
          },
          {
            title: '10. Changes to This Policy',
            body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on our platform or sending you an email. Your continued use of RatingBee after changes take effect constitutes your acceptance of the updated policy.'
          },
          {
            title: '11. Contact Us',
            body: 'If you have questions or concerns about this Privacy Policy or how we handle your personal information, please contact us at privacy@ratingbee.com.'
          },
        ].map(function(section) {
          return (
            <div key={section.title} style={{ marginBottom:'32px' }}>
              <h2 style={{ fontSize:'1.1rem', fontWeight:'700', color:'#1A1A1A', marginBottom:'10px' }}>{section.title}</h2>
              <p style={{ fontSize:'15px', color:'#444', lineHeight:'1.7' }}>{section.body}</p>
            </div>
          )
        })}
      </div>

      <Footer />
    </div>
  )
}
