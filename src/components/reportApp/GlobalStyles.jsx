export function GlobalStyles() {
  return (
    <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
        
        .font-vazirmatn {
          font-family: 'Vazirmatn', sans-serif;
        }
        
        * {
          font-family: 'Vazirmatn', sans-serif;
          direction: rtl;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        input[type="date"] {
          text-align: right;
        }
      `}</style>
  )
}
