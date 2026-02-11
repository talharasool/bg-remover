const features = [
  { num: '01', title: 'Upload', text: 'Drag and drop or click to select your image. We support all major formats.' },
  { num: '02', title: 'Process', text: 'Our AI analyzes and removes the background in under 5 seconds automatically.' },
  { num: '03', title: 'Download', text: 'Get your transparent PNG instantly. No watermarks, no quality loss.' },
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 pt-20 border-t border-border">
      {features.map((f) => (
        <div key={f.num} className="bg-surface border border-border rounded-[20px] p-8 transition-all duration-400 ease-bounce hover:-translate-y-2 hover:border-accent hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
          <div className="text-5xl font-bold text-accent opacity-30 leading-none mb-4">{f.num}</div>
          <div className="text-xl font-semibold mb-2">{f.title}</div>
          <div className="text-[15px] text-text-muted leading-relaxed">{f.text}</div>
        </div>
      ))}
    </div>
  );
}
