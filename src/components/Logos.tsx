const Logos: React.FC = () => {
    return (
        <section id="logos" className="py-32 px-5 bg-background">
            <p className="text-lg font-medium text-center">Trusted by <span className="text-secondary">thousands</span> of home cooks</p>
            <div className="mt-5 w-full flex flex-wrap flex-row items-center justify-evenly gap-5 sm:gap-10 opacity-45 logos-container">
                <svg width="129" height="48" viewBox="0 0 129 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5/6">
                    <path d="M44.9356 34.7749V20.2199H45.1949L55.7896 34.7749H59.1236V13.4006H55.4192V27.919H55.1598L44.5652 13.4006H41.2312V34.7749H44.9356Z" fill="black" />
                </svg>
                <svg width="80" height="48" viewBox="0 0 80 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5/6">
                    <path fillRule="evenodd" clipRule="evenodd" d="M79.3058 25.8169C79.3058 20.1774 76.5741 15.7274 71.3532 15.7274C66.1102 15.7274 62.938 20.1774 62.938 25.7728C62.938 32.4037 66.6829 35.7521 72.0581 35.7521C74.6796 35.7521 76.6622 35.1573 78.1602 34.3202V29.9143C76.6622 30.6633 74.9439 31.126 72.763 31.126C70.6262 31.126 68.7317 30.377 68.4893 27.7775H79.2617C79.2617 27.4911 79.3058 26.3456 79.3058 25.8169Z" fill="black" />
                </svg>
            </div>
        </section>
    )
}

export default Logos
