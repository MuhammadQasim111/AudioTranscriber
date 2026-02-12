
import React from 'react';

const LanguageBackground: React.FC = () => {
  const scripts = [
    { text: 'ہیلو', lang: 'Urdu', top: '10%', left: '5%', size: 'text-6xl', rotate: '-rotate-12' },
    { text: 'नमस्ते', lang: 'Hindi', top: '20%', left: '75%', size: 'text-5xl', rotate: 'rotate-6' },
    { text: 'Bonjour', lang: 'French', top: '60%', left: '10%', size: 'text-4xl', rotate: 'rotate-12' },
    { text: 'Transcription', lang: 'English', top: '80%', left: '70%', size: 'text-7xl', rotate: '-rotate-3' },
    { text: 'صوتی', lang: 'Urdu', top: '40%', left: '15%', size: 'text-5xl', rotate: 'rotate-45' },
    { text: 'अनुवाद', lang: 'Hindi', top: '15%', left: '40%', size: 'text-4xl', rotate: '-rotate-6' },
    { text: 'Accuracy', lang: 'English', top: '50%', left: '80%', size: 'text-3xl', rotate: 'rotate-90' },
    { text: 'Bienvenue', lang: 'French', top: '5%', left: '85%', size: 'text-5xl', rotate: '-rotate-12' },
    { text: 'اردو', lang: 'Urdu', top: '75%', left: '5%', size: 'text-8xl', rotate: 'rotate-12' },
    { text: 'भाषा', lang: 'Hindi', top: '85%', left: '30%', size: 'text-6xl', rotate: '-rotate-12' },
  ];

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none opacity-[0.03] sm:opacity-[0.05]">
      {scripts.map((item, i) => (
        <div
          key={i}
          className={`absolute font-bold transition-all duration-[3000ms] ${item.size} ${item.rotate} animate-pulse`}
          style={{ top: item.top, left: item.left }}
        >
          {item.text}
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 via-transparent to-indigo-50/50" />
    </div>
  );
};

export default LanguageBackground;
