import Link from 'next/link';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="min-h-[calc(100vh-48px)] bg-base-200 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-8 text-primary">Terms of Use</h1>
          
          <section className="prose lg:prose-xl">
            <h2>Last Updated: December 2024</h2>
            
            <p>
              Welcome to Thankful Thoughts. By accessing or using our service, you agree to these terms.
            </p>

            <h3>Age Requirements</h3>
            <p>
              You must be 18 years or older to use Thankful Thoughts. By using this service, 
              you confirm that you are at least 18 years old.
            </p>

            <h3>Third-Party Terms</h3>
            <p>
              Our service utilizes OpenRouter.ai for AI processing. By using Thankful Thoughts, you also agree to:
            </p>
            <ul>
              <li>
                <a href="https://openrouter.ai/terms" className="text-primary hover:underline">
                  OpenRouter.ai Terms of Service
                </a>
              </li>
              <li>All terms and conditions of the underlying model providers (Meta, Mistral AI)</li>
            </ul>

            <h3>Acceptable Use</h3>
            <p>
              You agree not to:
            </p>
            <ul>
              <li>Use the service for any illegal purpose</li>
              <li>Submit sensitive personal information or confidential data</li>
              <li>Attempt to bypass any security measures</li>
              <li>Use the service to harm others or spread misinformation</li>
              <li>Reverse engineer or attempt to extract the source code</li>
            </ul>

            <h3>Content Guidelines</h3>
            <p>
              When using Thankful Thoughts:
            </p>
            <ul>
              <li>Do not submit any harmful, threatening, or abusive content</li>
              <li>Avoid sharing personal identifying information</li>
              <li>Remember that content may be processed by AI models and could be used for training</li>
            </ul>

            <h3>Service Modifications</h3>
            <p>
              We reserve the right to:
            </p>
            <ul>
              <li>Modify or discontinue any part of the service</li>
              <li>Update these terms at any time</li>
              <li>Refuse service to anyone for any reason</li>
            </ul>

            <h3>Limitation of Liability</h3>
            <p>
              Thankful Thoughts is provided "as is" without warranties of any kind. We are not liable for:
            </p>
            <ul>
              <li>Any indirect, incidental, or consequential damages</li>
              <li>Content generated by AI models</li>
              <li>Service interruptions or data loss</li>
            </ul>

            <h3>Contact</h3>
            <p>
              For questions about these terms, please contact us.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
} 