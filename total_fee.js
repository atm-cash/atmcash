// v1.31 - Dynamisk Total samlet gebyr med automatisk oprettelse af elementer
const calcPages = [
    {id: 'revolutCalcPage', feeIds: ['lineBeforeFee','lineRevolutFee']},
    {id: 'wiseCalcPage', feeIds: ['wiseLineBeforeFee','wiseLineWiseFee']},
    {id: 'visaCalcPage', feeIds: ['visaLineBeforeFee','visaLinePercent','visaLineFixed']},
    {id: 'mastercardCalcPage', feeIds: ['mcLineBeforeFee','mcLinePercent','mcLineFixed']},
    {id: 'loomisCalcPage', feeIds: ['loomisLineBeforeFees','loomisLineFixed','loomisLineDelivery','loomisLineOther']},
    {id: 'forexCalcPage', feeIds: ['forexLineBeforeFees','forexLineFixed','forexLineDelivery','forexLineOther']},
    {id: 'tavexCalcPage', feeIds: ['tavexLineBeforeFees','tavexLineFixed','tavexLineDelivery','tavexLineOther']}
];

function parseDKK(value) {
    if(!value) return 0;
    return parseFloat(value.toString().replace('DKK','').replace(',','.').trim()) || 0;
}

function updateTotals(){
    calcPages.forEach(page => {
        const container = document.getElementById(page.id);
        if(container){
            let totalEl = container.querySelector('.totalFeeDisplay');
            if(!totalEl){
                totalEl = document.createElement('div');
                totalEl.className = 'totalFeeDisplay';
                totalEl.style.color = 'yellow';
                totalEl.style.fontWeight = 'bold';
                totalEl.style.marginTop = '10px';
                container.appendChild(totalEl);
            }

            let total = 0;
            page.feeIds.forEach(id => {
                const el = document.getElementById(id);
                total += parseDKK(el ? el.textContent : 0);
            });

            totalEl.textContent = 'Total samlet gebyr: ' + total.toFixed(2) + ' DKK';
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    updateTotals();
    calcPages.forEach(page => {
        const container = document.getElementById(page.id);
        if(container){
            const observer = new MutationObserver(updateTotals);
            observer.observe(container, { childList: true, subtree: true, characterData: true });
            container.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', updateTotals);
            });
        }
    });
});