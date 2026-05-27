// Fuldstændig ombygget, modulær og fremtidssikret Total samlet gebyr struktur
const calcPages = [
    {id: 'revolutCalcPage', totalId: 'lineFinalTotal', feeIds: ['lineBeforeFee','lineRevolutFee']},
    {id: 'wiseCalcPage', totalId: 'wiseLineFinalTotal', feeIds: ['wiseLineBeforeFee','wiseLineWiseFee']},
    {id: 'visaCalcPage', totalId: 'visaLineFinalTotal', feeIds: ['visaLineBeforeFee','visaLinePercent','visaLineFixed']},
    {id: 'mastercardCalcPage', totalId: 'mcLineFinalTotal', feeIds: ['mcLineBeforeFee','mcLinePercent','mcLineFixed']},
    {id: 'loomisCalcPage', totalId: 'loomisLineFinalTotal', feeIds: ['loomisLineBeforeFees','loomisLineFixed','loomisLineDelivery','loomisLineOther']},
    {id: 'forexCalcPage', totalId: 'forexLineFinalTotal', feeIds: ['forexLineBeforeFees','forexLineFixed','forexLineDelivery','forexLineOther']},
    {id: 'tavexCalcPage', totalId: 'tavexLineFinalTotal', feeIds: ['tavexLineBeforeFees','tavexLineFixed','tavexLineDelivery','tavexLineOther']}
];

function parseDKK(value) {
    if(!value) return 0;
    return parseFloat(value.toString().replace('DKK','').replace(',','.').trim()) || 0;
}

function updateTotals(){
    calcPages.forEach(page => {
        const totalEl = document.getElementById(page.totalId);
        if(totalEl){
            let total = 0;
            page.feeIds.forEach(id => {
                const el = document.getElementById(id);
                total += parseDKK(el ? el.textContent : 0);
            });
            totalEl.textContent = total.toFixed(2) + ' DKK';
            totalEl.style.color = 'yellow';
            totalEl.style.fontWeight = 'bold';
        }
    });
}

// Init ved DOM load
window.addEventListener('DOMContentLoaded', () => {
    updateTotals();

    // Observer input ændringer dynamisk
    calcPages.forEach(page => {
        const container = document.getElementById(page.id);
        if(container){
            const observer = new MutationObserver(updateTotals);
            observer.observe(container, { childList: true, subtree: true, characterData: true });

            // Tilføj input event listeners for alle DKK input felter
            container.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', updateTotals);
            });
        }
    });
});