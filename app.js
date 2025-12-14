// =======================================================
// app.js - Logic for Ticket Issuance (index.html)
// ✅ ປັບປຸງ: ເພີ່ມ Admin Password Gate ສໍາລັບເຂົ້າໜ້າ table.html
// =======================================================

// ⚠️ ລະຫັດຜູ້ເບິ່ງແຍງລະບົບ (Admin Password)
const ADMIN_PASSWORD = "Zxc12345_";

// 2. Firebase Configuration (🚨 ກະລຸນາແທນທີ່ດ້ວຍ Config ຂອງທ່ານເອງ!)
const firebaseConfig = {
    apiKey: "AIzaSyCHssutshGhHDvlkOiTpGCkqfsQx-RALCQ",
    authDomain: "chat-bot-7ecab.firebaseapp.com",
    databaseURL: "https://chat-bot-7ecab-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chat-bot-7ecab",
    storageBucket: "chat-bot-7ecab.firebasestorage.app",
    messagingSenderId: "95689786658",
    appId: "1:95689999999:web:e59a0958a2fbea2275d17b",
    measurementId: "G-Q2PMCHLTX3"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const ticketsCollection = db.collection("parking_tickets");

let currentTicketId = null;

// Helper Function: Generate Unique Ticket ID
function generateTicketId(vehicleType) {
    const prefix = vehicleType === 'Car' ? 'V' : 'M';
    const date = new Date();
    const dateString = date.getFullYear() + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
    const randomNum = String(Math.floor(1000 + Math.random() * 9000));
    return `${prefix}-${dateString}-${randomNum}`;
}

// ----------------------------------------------------
// 🌟 ຟັງຊັນ: ການຢືນຢັນລະຫັດຫົວໜ້າກ່ອນເຂົ້າໜ້າ Table 🌟
// ----------------------------------------------------

document.getElementById('confirmAdminGateBtn').addEventListener('click', () => {
    const enteredPassword = document.getElementById('adminGatePassword').value.trim();
    const errorMsg = document.getElementById('adminGateErrorMsg');
    const modal = bootstrap.Modal.getInstance(document.getElementById('adminGateModal'));

    if (enteredPassword === ADMIN_PASSWORD) {
        // ລະຫັດຖືກຕ້ອງ, ປິດ Modal ແລະ ໄປໜ້າ table.html
        modal.hide();
        window.location.href = 'table.html';
    } else {
        // ລະຫັດບໍ່ຖືກຕ້ອງ, ສະແດງຂໍ້ຄວາມຜິດພາດ
        errorMsg.style.display = 'block';
    }
});

// ຕັ້ງຄ່າເມື່ອ Modal ເປີດ: ລ້າງຄ່າ ແລະ ເຊື່ອງຂໍ້ຄວາມຜິດພາດ
document.getElementById('adminGateModal').addEventListener('shown.bs.modal', () => {
    document.getElementById('adminGatePassword').value = '';
    document.getElementById('adminGateErrorMsg').style.display = 'none';
    document.getElementById('adminGatePassword').focus();
});

// ----------------------------------------------------
// 🌟 ຟັງຊັນສຳລັບການພິມແບບ Modal (ຍັງຄືເກົ່າ) 🌟
// ----------------------------------------------------

// 1. ຟັງຊັນ: ສ້າງໃບຮັບເງິນເປັນຮູບພາບ
async function generateReceiptImage() {
    // ... (Code generateReceiptImage ຍັງຄືເກົ່າ) ...
    const receiptElement = document.getElementById('printReceipt');
    const container = document.getElementById('printContentContainer');

    receiptElement.style.position = 'absolute';
    receiptElement.style.left = '-9999px';
    receiptElement.style.opacity = '1';

    const qrcodeDisplayElement = document.getElementById('qrcodeDisplay');
    qrcodeDisplayElement.innerHTML = '';

    if (typeof QRCode !== 'undefined' && currentTicketId) {
        new QRCode(qrcodeDisplayElement, {
            text: currentTicketId,
            width: 100,
            height: 100,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    await new Promise(r => setTimeout(r, 100));

    const canvas = await html2canvas(receiptElement, {
        scale: 3,
        useCORS: true,
        logging: false
    });

    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.style.width = '100%';
    img.style.height = 'auto';

    container.innerHTML = '';
    container.appendChild(img);

    receiptElement.style.position = 'absolute';
    receiptElement.style.left = '-9999px';
    receiptElement.style.opacity = '0';
}

// 2. ຟັງຊັນ: ເປີດ Modal ພິມ
function showPrintModal() {
    if (!currentTicketId) {
        alert('ກະລຸນາອອກບັດກ່ອນທີ່ຈະພິມ!');
        return;
    }

    const printModal = new bootstrap.Modal(document.getElementById('receiptPrintModal'));
    printModal.show();

    generateReceiptImage();
}

// 3. ຟັງຊັນ: ຢືນຢັນການພິມ
document.getElementById('confirmPrintBtn').addEventListener('click', () => {
    const content = document.getElementById('printContentContainer').innerHTML;

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>ໃບຮັບບັດ</title>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    printWindow.onload = function () {
        printWindow.print();
        printWindow.close();
    };

    const modal = bootstrap.Modal.getInstance(document.getElementById('receiptPrintModal'));
    if (modal) modal.hide();
});

// ----------------------------------------------------
// 🌟 ຟັງຊັນຫຼັກ: ການອອກບັດ (ຍັງຄືເກົ່າ) 🌟
// ----------------------------------------------------

document.getElementById('issueTicketBtn').addEventListener('click', async () => {
    // ... (Code issueTicketBtn ຍັງຄືເກົ່າ) ...
    const vehicleTypeElement = document.querySelector('input[name="vehicleType"]:checked');
    const vehicleType = vehicleTypeElement ? vehicleTypeElement.value : 'Car';
    const licensePlate = document.getElementById('licensePlate').value.trim();
    const customerName = document.getElementById('customerName').value.trim();
    const depositDate = document.getElementById('depositDate').value;
    const issueByStaff = document.getElementById('issueByStaff').value.trim();
    const parkingFee = parseFloat(document.getElementById('parkingFee').value) || 0;

    if (!customerName || !depositDate || !issueByStaff) {
        const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
        document.getElementById('modalMessage').className = 'text-danger';
        document.getElementById('modalMessage').innerHTML = '<h4><i class="bi bi-exclamation-triangle-fill me-2"></i> ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບຖ້ວນ!</h4>';
        alertModal.show();
        return;
    }

    const ticketId = generateTicketId(vehicleType);
    currentTicketId = ticketId;

    const ticketData = {
        ticketId: ticketId,
        vehicleType: vehicleType,
        licensePlate: licensePlate || 'N/A',
        customerName: customerName,
        depositDate: depositDate,
        entryTime: firebase.firestore.FieldValue.serverTimestamp(),
        issueByStaff: issueByStaff,
        parkingFee: parkingFee,
        isUsed: false,
        scanTime: null,
    };

    try {
        await ticketsCollection.add(ticketData);

        // ສະແດງຂໍ້ມູນໃສ່ໃບຮັບເງິນ
        document.getElementById('displayTicketId').textContent = ticketId;
        document.getElementById('displayVehicleType').textContent = vehicleType === 'Car' ? 'ລົດໃຫຍ່' : 'ລົດຈັກ';
        document.getElementById('displayLicensePlate').textContent = licensePlate || 'N/A';
        document.getElementById('displayCustomerName').textContent = customerName;
        document.getElementById('displayDepositDate').textContent = depositDate;

        const now = new Date();
        document.getElementById('displayEntryTime').textContent = now.toLocaleTimeString('lo-LA') + ' ' + now.toLocaleDateString('lo-LA');

        document.getElementById('displayStaffName').textContent = issueByStaff;
        document.getElementById('displayFee').textContent = parkingFee.toLocaleString('lo-LA', { maximumFractionDigits: 0 });

        document.getElementById('resultCard').style.display = 'block';

        const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
        document.getElementById('modalMessage').className = 'text-success';
        document.getElementById('modalMessage').innerHTML = '<h4><i class="bi bi-check-circle-fill me-2"></i> ອອກບັດສຳເລັດແລ້ວ!</h4>';
        alertModal.show();

        const motoWarningDisplayElement = document.getElementById('motoWarningDisplay');
        const motoWarningReceiptElement = document.getElementById('motoWarningReceipt');

        if (vehicleType === 'Car') {
            motoWarningDisplayElement.style.display = 'none';
            motoWarningReceiptElement.style.display = 'none';
        } else {
            motoWarningDisplayElement.style.display = 'list-item';
            motoWarningReceiptElement.style.display = 'list-item';
        }

    } catch (e) {
        console.error("Error adding document: ", e);
        currentTicketId = null;
        const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
        document.getElementById('modalMessage').className = 'text-danger';
        document.getElementById('modalMessage').innerHTML = `<h4><i class="bi bi-x-circle-fill me-2"></i> ຜິດພາດໃນການບັນທຶກ! ກວດສອບ Firebase Config.</h4>`;
        alertModal.show();
    }
});

// Logic ສໍາລັບປຸ່ມລ້າງຂໍ້ມູນ
document.getElementById('resetFormBtn').addEventListener('click', () => {
    document.getElementById('licensePlate').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('issueByStaff').value = '';
    document.getElementById('parkingFee').value = '0';
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('depositDate').valueAsDate = new Date();
    currentTicketId = null;
});

// ຕັ້ງຄ່າເບື້ອງຕົ້ນ
document.addEventListener('DOMContentLoaded', () => {
    const depositDateElement = document.getElementById('depositDate');
    if (depositDateElement) {
        depositDateElement.valueAsDate = new Date();
    }
});

// ເປີດເຜີຍຟັງຊັນໃຫ້ HTML ເອີ້ນໃຊ້
window.showPrintModal = showPrintModal;
