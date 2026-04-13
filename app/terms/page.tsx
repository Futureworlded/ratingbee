import Footer from '../components/Footer'

export default function TermsPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#F5F3EE' }}>
      <nav style={{ background:'white', borderBottom:'1px solid rgba(0,0,0,0.07)', padding:'0 24px', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <a href="/">
          <img src="/rating-bee.png" alt="RatingBee" style={{ height:'28px', width:'auto' }} />
        </a>
        <a href="/" style={{ fontSize:'14px', color:'#555', textDecoration:'none' }}>← Back to home</a>
      </nav>

      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'48px 24px 80px' }}>
        <h1 style={{ fontSize:'2rem', fontWeight:'700', color:'#1A1A1A', fontFamily:'Georgia, serif', marginBottom:'8px' }}>Terms of Service</h1>
        <p style={{ fontSize:'14px', color:'#888', marginBottom:'40px' }}>Last updated: April 2026</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: 'By accessing or using RatingBee, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. We reserve the right to update these terms at any time, and your continued use of RatingBee constitutes acceptance of any changes.'
          },
          {
            title: '2. Use of the Platform',
            body: 'RatingBee is a local business review and reputation platform. You may use RatingBee to read reviews, write reviews, claim business listings, and engage with community content. You agree not to use RatingBee for any unlawful purpose or in any way that could harm other users, businesses, or the platform itself.'
          },
          {
            title: '3. User Accounts',
            body: 'You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. You must notify us immediately if you suspect unauthorized access to your account. We reserve the right to suspend or terminate accounts that violate these terms.'
          },
          {
            title: '4. Reviews and Content',
            body: 'Reviews must be based on genuine first-hand experiences. You may not post false, misleading, or defamatory reviews. You may not post reviews in exchange for payment, discounts, or other incentives unless clearly disclosed. RatingBee reserves the right to remove content that violates our community guidelines or these terms.'
          },
          {
            title: '5. Business Listings',
            body: 'Business owners may claim their listings by verifying ownership through our SMS verification process. Claimed listings must represent actual businesses you own or manage. Falsely claiming a business listing is a violation of these terms and may result in account termination and legal action.'
          },
          {
            title: '6. Intellectual Property',
            body: 'RatingBee and its content, features, and functionality are owned by RatingBee, Inc. and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.'
          },
          {
            title: '7. Third-Party Data',
            body: 'RatingBee displays data from third-party sources including Google Places and TripAdvisor. This data is provided for informational purposes only. We make no warranties about the accuracy or completeness of third-party data and are not responsible for errors or omissions in such data.'
          },
          {
            title: '8. Limitation of Liability',
            body: 'RatingBee is provided on an "as is" basis without warranties of any kind. We are not liable for any damages arising from your use of the platform, including but not limited to direct, indirect, incidental, or consequential damages. Our total liability to you shall not exceed the amount you paid us in the twelve months preceding the claim.'
          },
          {
            title: '9. Privacy',
            body: 'Your use of RatingBee is also governed by our Privacy Policy, which is incorporated into these terms by reference. Please review our Privacy Policy to understand our practices regarding the collection and use of your personal information.'
          },
          {
            title: '10. Contact',
            body: 'If you have questions about these Terms of Service, please contact us at legal@ratingbee.com.'
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
