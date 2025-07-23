<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Simple file-based storage for GitHub Pages compatibility
$announcements_file = 'announcements.json';

function loadAnnouncements() {
    global $announcements_file;
    if (file_exists($announcements_file)) {
        $content = file_get_contents($announcements_file);
        return json_decode($content, true) ?: [];
    }
    return [];
}

function saveAnnouncements($announcements) {
    global $announcements_file;
    return file_put_contents($announcements_file, json_encode($announcements, JSON_PRETTY_PRINT));
}

function cleanExpiredAnnouncements($announcements) {
    $now = time();
    return array_filter($announcements, function($announcement) use ($now) {
        return strtotime($announcement['expiresAt']) > $now;
    });
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $announcements = loadAnnouncements();
        $announcements = cleanExpiredAnnouncements($announcements);
        saveAnnouncements($announcements);
        echo json_encode(array_values($announcements));
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['text']) || !isset($input['author'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit;
        }
        
        $announcements = loadAnnouncements();
        $announcements = cleanExpiredAnnouncements($announcements);
        
        // Check if user already has an active announcement
        $authorAnnouncements = array_filter($announcements, function($announcement) use ($input) {
            return $announcement['author'] === $input['author'];
        });
        
        if (count($authorAnnouncements) > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'You already have an active announcement. Please remove it first.']);
            exit;
        }
        
        $announcement = [
            'id' => time() . '_' . random_int(1000, 9999),
            'text' => strip_tags($input['text']),
            'type' => in_array($input['type'], ['warning', 'info']) ? $input['type'] : 'info',
            'author' => strip_tags($input['author']),
            'createdAt' => date('c'),
            'expiresAt' => date('c', time() + ($input['duration'] * 3600))
        ];
        
        $announcements[] = $announcement;
        saveAnnouncements($announcements);
        
        echo json_encode($announcement);
        break;
        
    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing announcement ID']);
            exit;
        }
        
        $announcements = loadAnnouncements();
        $announcements = array_filter($announcements, function($announcement) use ($input) {
            return $announcement['id'] !== $input['id'];
        });
        
        saveAnnouncements(array_values($announcements));
        echo json_encode(['success' => true]);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>