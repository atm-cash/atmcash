
// Dette script tilføjer dynamisk Total samlet gebyr i gul, præcis som på billedet.

function updateTotalFee() {
    const feeElements = document.querySelectorAll('.fee-values');
    let total = 0;

    feeElements.forEach(el => {
        let value = parseFloat(el.textContent.replace('DKK','').trim());
        if(!isNaN(value)) total += value;
    });

    let totalContainer = document.querySelector('#total-fee');
    if(!totalContainer) {
        totalContainer = document.createElement('div');
        totalContainer.id = 'total-fee';
        totalContainer.style.color = 'yellow';
        totalContainer.style.fontWeight = 'bold';
        totalContainer.style.marginTop = '10px';
        const feesSection = document.querySelector('#fees-section');
        if(feesSection) feesSection.appendChild(totalContainer);
    }

    totalContainer.textContent = total.toFixed(2) + ' DKK';
}

window.addEventListener('DOMContentLoaded', updateTotalFee);

const feesSection = document.querySelector('#fees-section');
if(feesSection) {
    const observer = new MutationObserver(updateTotalFee);
    observer.observe(feesSection, { childList: true, subtree: true, characterData: true });
}
