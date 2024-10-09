import { init, requestProvider } from 'https://esm.sh/@getalby/bitcoin-connect@3.6.2';

document.addEventListener('DOMContentLoaded', () => {
    init({
        appName: 'Zaplist',
        filters: ["nwc"],
    });

    const walletInfo = document.getElementById('wallet-info');
    const balanceElement = document.getElementById('balance');
    const paymentSection = document.getElementById('payment-section');
    const generateInvoiceBtn = document.getElementById('generate-invoice');
    const amountInput = document.getElementById('amount');
    const invoiceDisplay = document.getElementById('invoice-display');
    const invoiceElement = document.getElementById('invoice');
    const payInvoiceBtn = document.getElementById('pay-invoice');
    const paymentStatus = document.getElementById('payment-status');

    let webln;

    document.querySelector('bc-button').addEventListener('click', async () => {
        try {
            webln = await requestProvider();
            const info = await webln.getInfo();
            balanceElement.textContent = info.balance.toString();
            walletInfo.style.display = 'block';
            paymentSection.style.display = 'block';
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        }
    });

    generateInvoiceBtn.addEventListener('click', async () => {
        const amount = amountInput.value;
        if (!amount) {
            alert('Please enter an amount');
            return;
        }

        try {
            const response = await fetch('/generate_invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount }),
            });
            const data = await response.json();
            invoiceElement.textContent = data.invoice;
            invoiceDisplay.style.display = 'block';
        } catch (error) {
            console.error('Failed to generate invoice:', error);
        }
    });

    payInvoiceBtn.addEventListener('click', async () => {
        const invoice = invoiceElement.textContent;
        if (!invoice) {
            alert('No invoice to pay');
            return;
        }

        try {
            const result = await webln.sendPayment(invoice);
            paymentStatus.textContent = `Payment successful! Preimage: ${result.preimage}`;
            paymentStatus.style.display = 'block';
        } catch (error) {
            console.error('Payment failed:', error);
            paymentStatus.textContent = 'Payment failed: ' + error.message;
            paymentStatus.style.display = 'block';
        }
    });
});
