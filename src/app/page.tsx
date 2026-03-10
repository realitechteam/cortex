import {
  Brain,
  FileText,
  MessageSquare,
  Lightbulb,
  ArrowRight,
  Zap,
  Shield,
  Search,
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: FileText,
    title: 'Smart Upload',
    description:
      'Upload text, markdown, CSV, and JSON files. Cortex automatically chunks and indexes your documents for intelligent retrieval.',
  },
  {
    icon: MessageSquare,
    title: 'AI-Powered Q&A',
    description:
      'Ask questions in natural language. Get accurate answers with citations from your document library.',
  },
  {
    icon: Lightbulb,
    title: 'Cross-Document Insights',
    description:
      'Discover patterns, connections, and themes across your entire document collection.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Upload',
    description: 'Add your documents to Cortex',
    icon: FileText,
  },
  {
    number: '02',
    title: 'Ask',
    description: 'Query your knowledge base naturally',
    icon: Search,
  },
  {
    number: '03',
    title: 'Discover',
    description: 'Get AI-powered answers and insights',
    icon: Zap,
  },
];

export default function HomePage() {
  return (
    <div className="h-full overflow-auto scrollbar-thin">
      <div className="max-w-6xl mx-auto px-8 py-16 space-y-24">
        {/* ---------------------------------------------------------------- */}
        {/* Hero Section                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className="text-center space-y-8 pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cortex-blue-500/10 border border-cortex-blue-500/20 text-cortex-blue-400 text-sm font-medium">
            <Brain className="w-4 h-4" />
            AI-Powered Document Intelligence
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-cortex-blue-400 to-cortex-blue-600 bg-clip-text text-transparent">
              Your Documents,
            </span>
            <br />
            <span className="text-white">Intelligently Understood</span>
          </h1>

          <p className="text-lg text-cortex-dark-400 max-w-2xl mx-auto leading-relaxed">
            Upload documents, ask questions, and get AI-powered insights from
            your entire knowledge base.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cortex-blue-500 hover:bg-cortex-blue-600 text-white font-semibold text-sm shadow-lg shadow-cortex-blue-500/25 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Upload Documents
            </Link>

            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-cortex-dark-600 hover:border-cortex-dark-500 text-cortex-dark-300 hover:text-white font-semibold text-sm transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Start Chatting
            </Link>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Feature Cards                                                    */}
        {/* ---------------------------------------------------------------- */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Everything you need to unlock your knowledge
            </h2>
            <p className="text-cortex-dark-400 text-sm">
              Powerful features that work together seamlessly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-cortex-dark-800 border border-cortex-dark-700 rounded-2xl p-6 space-y-4 hover:border-cortex-dark-600 transition-colors group"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cortex-blue-500/10 border border-cortex-blue-500/20 group-hover:bg-cortex-blue-500/20 transition-colors">
                  <Icon className="w-6 h-6 text-cortex-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-cortex-dark-400 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* How It Works                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">How it works</h2>
            <p className="text-cortex-dark-400 text-sm">
              Three simple steps to smarter documents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ number, title, description, icon: Icon }, index) => (
              <div key={title} className="relative text-center space-y-4">
                {/* Connector line (hidden on mobile & last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-cortex-dark-700" />
                )}

                <div className="flex items-center justify-center mx-auto w-16 h-16 rounded-2xl bg-cortex-dark-800 border border-cortex-dark-700">
                  <Icon className="w-7 h-7 text-cortex-blue-400" />
                </div>
                <span className="inline-block text-xs font-bold text-cortex-blue-400 bg-cortex-blue-500/10 px-2.5 py-0.5 rounded-full">
                  Step {number}
                </span>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-cortex-dark-400">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Bottom CTA                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section className="text-center space-y-6 pb-8">
          <div className="bg-cortex-dark-800 border border-cortex-dark-700 rounded-2xl p-10 space-y-5">
            <Shield className="w-10 h-10 text-cortex-blue-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">
              Ready to get started?
            </h2>
            <p className="text-cortex-dark-400 text-sm max-w-md mx-auto">
              Upload your first document and experience the power of AI-driven
              document intelligence.
            </p>
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cortex-blue-500 hover:bg-cortex-blue-600 text-white font-semibold text-sm shadow-lg shadow-cortex-blue-500/25 transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
