import Link from 'next/link';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="min-h-[calc(100vh-48px)] bg-base-200 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-8 text-primary">Privacy Policy</h1>
          
          <section className="prose lg:prose-xl">
            <h2>Last Updated: December 2024</h2>
            
            <p>
              At Thankful Thoughts, we take your privacy seriously. This policy explains how we collect, 
              use, and protect your personal information.
            </p>

            <h3>Age Restriction</h3>
            <p>
              Thankful Thoughts is intended for users 18 years of age and older. We do not 
              knowingly collect information from anyone under 18 years of age.
            </p>

            <h3>Data Collection</h3>
            <p>
              We collect the following information:
            </p>
            <ul>
              <li>Email address (for authentication)</li>
              <li>Name (optional, for personalization)</li>
              <li>Messages you create using our service</li>
            </ul>

            <h3>Data Usage</h3>
            <p>
              Your data is used exclusively to:
            </p>
            <ul>
              <li>Provide and improve our service</li>
              <li>Save and manage your thankful thought messages</li>
              <li>Authenticate your account</li>
              <li>Communicate important updates about our service</li>
            </ul>

            <h3>Third-Party Services</h3>
            <p>
              We use the following third-party services:
            </p>
            <ul>
              <li>
                <strong>Clerk</strong> - For user authentication and account management
              </li>
              <li>
                <strong>OpenRouter.ai</strong> - For processing message generation requests
                <ul>
                  <li>Messages you input are processed through OpenRouter's API</li>
                  <li>We use Meta's Llama 3.1 and Mistral AI's Mistral-8B models</li>
                  <li>Important privacy considerations:
                    <ul>
                      <li>Do not ever enter in sensitive personal information or confidential
                        information.  Always assume that whatever you type in is being stored and 
                        may be used for training AI models - which means it may publicly become available.</li>
                      <li>Your messages are processed by these AI models and may be temporarily stored for processing</li>
                      <li>OpenRouter acts as an intermediary and routes requests to the original model providers</li>
                      <li>Data handling varies by model provider:
                        <ul>
                          <li>Meta (Llama): Messages may be used for model improvement</li>
                          <li>Mistral AI: Follows GDPR compliance for EU users</li>
                        </ul>
                      </li>
                      <li>For complete details, see <a href="https://openrouter.ai/privacy" className="text-primary hover:underline">OpenRouter's Privacy Policy</a> and the respective model providers' policies</li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>

            <h3>Data Reselling</h3>
            <p>
              <strong>We do not sell your personal information or data to any third parties.</strong> Your 
              information is used solely for providing our service.
            </p>

            <h3>Data Storage</h3>
            <p>
              Your data is stored securely in our database. We implement appropriate security measures to 
              protect against unauthorized access, alteration, disclosure, or destruction of your information.
            </p>

            <h3>Your Rights</h3>
            <p>
              Under GDPR and various privacy laws, you have the right to:
            </p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Restrict processing of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>

            <p>
              For users in the European Union, we comply with all GDPR requirements 
              and will respond to any data-related requests within the required timeframe.
            </p>

            <h3>Contact Us</h3>
            <p>
              If you have any questions about our privacy policy or how we handle your data, please contact us.
            </p>

            <h3>US Privacy Rights</h3>
            <p>
              Depending on your state of residence, you may have additional rights:
            </p>
            <ul>
              <li><strong>California (CCPA/CPRA):</strong>
                <ul>
                  <li>Right to know what personal information is collected</li>
                  <li>Right to delete personal information</li>
                  <li>Right to opt-out of the sale of personal information</li>
                  <li>Right to non-discrimination for exercising these rights</li>
                </ul>
              </li>
              <li><strong>Virginia (VCDPA):</strong>
                <ul>
                  <li>Right to confirm whether personal data is being processed</li>
                  <li>Right to correct inaccuracies</li>
                  <li>Right to data portability</li>
                </ul>
              </li>
              <li><strong>Colorado (CPA):</strong> Similar rights to CCPA and VCDPA</li>
            </ul>

            <h3>Data Collection Practices</h3>
            <p>
              In compliance with US privacy laws, we:
            </p>
            <ul>
              <li>Only collect information necessary for the service to function</li>
              <li>Do not sell personal information to third parties</li>
              <li>Provide clear notice before collecting personal information</li>
              <li>Maintain reasonable security procedures</li>
              <li>Honor "Do Not Track" browser settings</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
} 