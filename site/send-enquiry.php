<?php
/**
 * The contact form's mailer (contactFormEndpoint in src/config.js): checks the enquiry the same way
 * the form does (src/scripts/main.js) and emails it through the company's SMTP account with
 * PHPMailer (lib/PHPMailer). Needs PHP 7.2+ (with openssl for SSL/TLS), as on cPanel hosting.
 *
 * The SMTP login and the receiving address(es) are not in the website: they are read from a .env
 * file (see .env.example in the project folder), looked for first one folder ABOVE this file
 * (outside public_html: /home/<account>/.env — the safe place) and then next to it. Real environment
 * variables of the same names take precedence.
 *
 * The page sends the form with fetch() and "Accept: application/json" and gets
 * { ok, message } back; without JavaScript the form posts here directly and gets a small page.
 */
declare(strict_types=1);

use PHPMailer\PHPMailer\Exception as MailException;
use PHPMailer\PHPMailer\PHPMailer;

require __DIR__ . '/lib/PHPMailer/Exception.php';
require __DIR__ . '/lib/PHPMailer/PHPMailer.php';
require __DIR__ . '/lib/PHPMailer/SMTP.php';

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(int $status, bool $ok, string $message): void
{
    global $wantsJson;
    http_response_code($status);
    header('Cache-Control: no-store');
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message]);
    } else {
        header('Content-Type: text/html; charset=utf-8');
        $title = $ok ? 'Enquiry submitted' : 'Enquiry not sent';
        echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">'
            . '<title>' . $title . ' | Brand Image Media Pvt Ltd</title></head>'
            . '<body style="font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 20px;color:#2B2A28">'
            . '<h1 style="color:#2468B1">' . $title . '</h1><p>' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</p>'
            . '<p><a href="contact.html" style="color:#2468B1">Back to the Contact page</a></p></body></html>';
    }
    exit;
}

/** KEY=VALUE lines of the first .env found (blank lines and # comments skipped, quotes removed). */
function load_env(): array
{
    foreach ([dirname(__DIR__) . '/.env', __DIR__ . '/.env'] as $file) {
        if (!is_file($file) || !is_readable($file)) {
            continue;
        }
        $values = [];
        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
                continue;
            }
            list($key, $value) = array_map('trim', explode('=', $line, 2));
            if (strlen($value) >= 2 && ($value[0] === '"' || $value[0] === "'") && substr($value, -1) === $value[0]) {
                $value = substr($value, 1, -1);
            }
            $values[$key] = $value;
        }
        return $values;
    }
    return [];
}

function text_length(string $value): int
{
    return (int) preg_match_all('/./us', $value);
}

/** One line of text: trimmed, with line breaks and other control characters removed. */
function one_line(string $value): string
{
    return trim((string) preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Please send your enquiry from the Contact page.');
}

// Only from this website's own pages
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = strtolower((string) preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
if ($origin !== '' && strtolower((string) parse_url($origin, PHP_URL_HOST)) !== $host) {
    respond(403, false, 'Please send your enquiry from the Contact page.');
}

// The hidden field (_hp) is left empty by people and filled in by spam robots: pretend it worked
if (trim((string) ($_POST['_hp'] ?? '')) !== '') {
    respond(200, true, 'Your enquiry has been successfully submitted.');
}

// The same checks as the form (src/scripts/main.js; lengths from LIMITS in src/components/sections.js)
$name = one_line((string) ($_POST['name'] ?? ''));
$email = one_line((string) ($_POST['email'] ?? ''));
$phone = one_line((string) ($_POST['phone'] ?? ''));
$service = one_line((string) ($_POST['service'] ?? ''));
$message = trim(str_replace(["\r\n", "\r"], "\n", (string) ($_POST['message'] ?? '')));

$digits = preg_replace('/\D/', '', $phone);
if (strlen($digits) === 12 && strpos($digits, '91') === 0) {
    $digits = substr($digits, 2);
} elseif (strlen($digits) === 11 && $digits[0] === '0') {
    $digits = substr($digits, 1);
}

$valid = text_length($name) >= 2 && text_length($name) <= 50 && !preg_match('/\d/', $name)
    && strlen($email) >= 6 && strlen($email) <= 100 && filter_var($email, FILTER_VALIDATE_EMAIL)
    && strlen($phone) >= 10 && strlen($phone) <= 16 && preg_match('/^\+?[\d\s()-]+$/', $phone) && preg_match('/^[6-9]\d{9}$/', $digits)
    && $service !== '' && text_length($service) <= 100
    && text_length($message) >= 10 && text_length($message) <= 1000;
if (!$valid) {
    respond(422, false, 'Please check the highlighted fields and try again.');
}

// SMTP settings and receivers from .env
$env = load_env();
$setting = function (string $key, string $default = '') use ($env): string {
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }
    return isset($env[$key]) && $env[$key] !== '' ? $env[$key] : $default;
};

// Google reCAPTCHA ("I'm not a robot"), when RECAPTCHA_SECRET is set in .env: the tick sent with the form
// (g-recaptcha-response) is checked with Google; without a valid tick nothing is sent
$captchaSecret = $setting('RECAPTCHA_SECRET');
if ($captchaSecret !== '') {
    $captchaToken = trim((string) ($_POST['g-recaptcha-response'] ?? ''));
    $captchaOk = false;
    if ($captchaToken !== '') {
        $query = http_build_query([
            'secret' => $captchaSecret,
            'response' => $captchaToken,
            'remoteip' => (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
        ]);
        $answer = false;
        if (function_exists('curl_init')) {
            $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $query,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
            ]);
            $answer = curl_exec($ch);
            unset($ch);
        } else {
            $answer = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
                    'content' => $query,
                    'timeout' => 10,
                ],
            ]));
        }
        $result = is_string($answer) ? json_decode($answer, true) : null;
        $captchaOk = is_array($result) && !empty($result['success']);
        if (!$captchaOk) {
            error_log('send-enquiry.php: reCAPTCHA not passed (' . (is_array($result) ? json_encode($result['error-codes'] ?? []) : 'no answer from Google') . ')');
        }
    }
    if (!$captchaOk) {
        respond(403, false, 'Please tick "I\'m not a robot" and try again.');
    }
}

$smtpHost = $setting('SMTP_HOST');
$smtpPort = (int) $setting('SMTP_PORT', '465');
$smtpSecure = strtolower($setting('SMTP_SECURE', $smtpPort === 465 ? 'ssl' : 'tls'));
$smtpUser = $setting('SMTP_USER');
$smtpPass = $setting('SMTP_PASS');
$fromEmail = $setting('MAIL_FROM', $smtpUser);
$fromName = $setting('MAIL_FROM_NAME', 'Brand Image Website');
$receivers = array_values(array_filter(array_map('trim', explode(',', $setting('MAIL_TO')))));

if ($smtpHost === '' || $fromEmail === '' || !$receivers) {
    error_log('send-enquiry.php: SMTP_HOST, MAIL_FROM / SMTP_USER or MAIL_TO is missing from .env');
    respond(500, false, 'Sorry, enquiries cannot be sent right now.');
}

// The email: the design in lib/enquiry-email.html (shared with the local preview, src/preview-mailer.js),
// filled in with the enquiry made safe for HTML, and a plain-text copy for mail apps that show text only
$e = function (string $value): string {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
};
$nameParts = explode(' ', $name);
$fill = [
    '{{name}}' => $e($name),
    '{{first_name}}' => $e($nameParts[0]),
    '{{email}}' => $e($email),
    '{{phone}}' => $e($phone),
    '{{tel}}' => $e('+91' . $digits),
    '{{service}}' => $e($service),
    '{{message}}' => str_replace("\n", "<br>\n", $e($message)),
    '{{reply_subject}}' => $e(rawurlencode('Re: Website enquiry: ' . $service)),
];
$text = "New enquiry from the website\n\nName: " . $name . "\nEmail: " . $email . "\nPhone: " . $phone
    . "\nService: " . $service . "\n\nMessage:\n" . $message . "\n";
$templateFile = __DIR__ . '/lib/enquiry-email.html';
$template = is_file($templateFile) ? (string) file_get_contents($templateFile) : '';
if ($template !== '') {
    $html = (string) preg_replace('/\{\{\w+\}\}/', '', strtr($template, $fill));
} else {
    $html = '<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2B2A28">'
        . str_replace("\n", "<br>\n", $e($text)) . '</p>';
}

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = $smtpHost;
    $mail->Port = $smtpPort;
    if ($smtpSecure === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($smtpSecure === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    } else {
        $mail->SMTPSecure = '';
        $mail->SMTPAutoTLS = false;
    }
    $mail->SMTPAuth = $smtpUser !== '';
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;
    $mail->Timeout = 20;
    $mail->CharSet = PHPMailer::CHARSET_UTF8;

    $mail->setFrom($fromEmail, $fromName);
    foreach ($receivers as $receiver) {
        $mail->addAddress($receiver);
    }
    $mail->addReplyTo($email, $name);
    $mail->Subject = 'Website enquiry: ' . $service . ' - ' . $name;
    $mail->isHTML(true);
    $mail->Body = $html;
    $mail->AltBody = $text;
    $mail->send();
} catch (MailException $e) {
    error_log('send-enquiry.php: ' . $mail->ErrorInfo);
    respond(502, false, 'Sorry, your enquiry could not be sent.');
}

respond(200, true, 'Your enquiry has been successfully submitted.');
