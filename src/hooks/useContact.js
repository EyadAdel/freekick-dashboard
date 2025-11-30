import Swal from 'sweetalert2';

export const useContact = () => {
    const openGmail = (email, subject = '', body = '') => {
        const params = new URLSearchParams({
            to: email,
            subject: subject,
            body: body
        });
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&${params.toString()}`, '_blank');
    };

    const openDefaultEmail = (email, subject = '', body = '') => {
        window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    };

    const copyToClipboard = (text, successMessage = 'Copied to clipboard') => {
        navigator.clipboard.writeText(text).then(() => {
            Swal.fire({
                title: 'Success!',
                text: successMessage,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }).catch(() => {
            Swal.fire({
                title: 'Error!',
                text: 'Failed to copy to clipboard',
                icon: 'error',
                timer: 1500,
                showConfirmButton: false
            });
        });
    };

    const openWhatsApp = (phone, message = '') => {
        const formattedPhone = phone.replace(/\D/g, '');
        const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleEmailClick = (email, subject = '', body = '') => {
        Swal.fire({
            title: "Send Email",
            text: "Choose how you want to send the email:",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Gmail (Browser)",
            cancelButtonText: "Default Email",
            showDenyButton: true,
            denyButtonText: "Copy Email Only",
            customClass: {
                confirmButton: "bg-primary600 hover:bg-primary",
                cancelButton: "bg-gray-600 hover:bg-gray-700",
                denyButton: "bg-green-600 hover:bg-green-700",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                openGmail(email, subject, body);
            } else if (result.isDenied) {
                copyToClipboard(email, "Email address copied to clipboard");
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                openDefaultEmail(email, subject, body);
            }
        });
    };

    const handleWhatsAppClick = (phone, message = '') => {
        if (!phone) {
            Swal.fire({
                title: 'Error!',
                text: 'No phone number available',
                icon: 'error',
                timer: 1500,
                showConfirmButton: false
            });
            return;
        }

        Swal.fire({
            title: "Send WhatsApp Message",
            text: "Choose an action:",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Open WhatsApp",
            cancelButtonText: "Cancel",
            showDenyButton: true,
            denyButtonText: "Copy Phone Number",
            customClass: {
                confirmButton: "bg-green-600 hover:bg-green-700",
                cancelButton: "bg-gray-600 hover:bg-gray-700",
                denyButton: "bg-blue-600 hover:bg-blue-700",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                openWhatsApp(phone, message);
            } else if (result.isDenied) {
                copyToClipboard(phone, "Phone number copied to clipboard");
            }
        });
    };

    return {
        handleEmailClick,
        handleWhatsAppClick,
        openGmail,
        openDefaultEmail,
        openWhatsApp,
        copyToClipboard
    };
};