<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CloudinaryService
{
    /**
     * Parse and fetch Cloudinary credentials from individual vars or CLOUDINARY_URL.
     *
     * @return array [ $cloudName, $apiKey, $apiSecret ]
     */
    private static function getCredentials(): array
    {
        $cloudName = env('CLOUDINARY_CLOUD_NAME');
        $apiKey = env('CLOUDINARY_API_KEY');
        $apiSecret = env('CLOUDINARY_API_SECRET');

        $cloudinaryUrl = env('CLOUDINARY_URL');
        if ($cloudinaryUrl) {
            $parsed = parse_url($cloudinaryUrl);
            if (isset($parsed['host'])) {
                $cloudName = $parsed['host'];
            }
            if (isset($parsed['user'])) {
                $apiKey = $parsed['user'];
            }
            if (isset($parsed['pass'])) {
                $apiSecret = $parsed['pass'];
            }
        }

        return [$cloudName, $apiKey, $apiSecret];
    }

    /**
     * Upload an image to Cloudinary (or mock local storage if credentials are missing).
     *
     * @param \Illuminate\Http\UploadedFile|string $file
     * @param string $folder
     * @return array [ 'url' => ..., 'public_id' => ... ]
     */
    public static function upload($file, string $folder = 'lave_shoes'): array
    {
        list($cloudName, $apiKey, $apiSecret) = self::getCredentials();

        // Check if credentials are set, if not use Mock Local Driver
        if (empty($cloudName) || empty($apiKey) || empty($apiSecret) || str_contains($apiKey, 'your_api_key')) {
            return self::uploadMockLocal($file, $folder);
        }

        try {
            $timestamp = time();
            
            // Build signature params
            $params = [
                'folder' => $folder,
                'timestamp' => $timestamp,
            ];
            ksort($params);
            
            // Generate SHA1 signature
            $signatureStr = "";
            foreach ($params as $key => $value) {
                $signatureStr .= "{$key}={$value}&";
            }
            $signatureStr = rtrim($signatureStr, '&') . $apiSecret;
            $signature = sha1($signatureStr);

            // Send POST request
            $response = Http::asMultipart()->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/upload", [
                'file' => is_string($file) ? $file : fopen($file->getRealPath(), 'r'),
                'api_key' => $apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
                'folder' => $folder,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'url' => $data['secure_url'],
                    'public_id' => $data['public_id'],
                ];
            }

            Log::error("Cloudinary Upload Error: " . $response->body());
            return self::uploadMockLocal($file, $folder);
        } catch (\Exception $e) {
            Log::error("Cloudinary Exception: " . $e->getMessage());
            return self::uploadMockLocal($file, $folder);
        }
    }

    /**
     * Delete an asset from Cloudinary (or from mock local storage).
     *
     * @param string $publicId
     * @return bool
     */
    public static function delete(string $publicId): bool
    {
        // Check if it's a mock local file
        if (str_starts_with($publicId, 'mock_')) {
            $filename = str_replace('mock_', '', $publicId);
            if (Storage::disk('public')->exists("mock_cloudinary/{$filename}")) {
                Storage::disk('public')->delete("mock_cloudinary/{$filename}");
                return true;
            }
            return false;
        }

        list($cloudName, $apiKey, $apiSecret) = self::getCredentials();

        if (empty($cloudName) || empty($apiKey) || empty($apiSecret) || str_contains($apiKey, 'your_api_key')) {
            return false;
        }

        try {
            $timestamp = time();
            $params = [
                'public_id' => $publicId,
                'timestamp' => $timestamp,
            ];
            ksort($params);

            $signatureStr = "";
            foreach ($params as $key => $value) {
                $signatureStr .= "{$key}={$value}&";
            }
            $signatureStr = rtrim($signatureStr, '&') . $apiSecret;
            $signature = sha1($signatureStr);

            $response = Http::post("https://api.cloudinary.com/v1_1/{$cloudName}/image/destroy", [
                'public_id' => $publicId,
                'api_key' => $apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return isset($data['result']) && $data['result'] === 'ok';
            }

            Log::error("Cloudinary Deletion Error: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("Cloudinary Deletion Exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Fallback mock local driver upload.
     */
    private static function uploadMockLocal($file, string $folder): array
    {
        $filename = Str::random(40) . '.png';
        
        if (is_string($file)) {
            $data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $file));
            Storage::disk('public')->put("mock_cloudinary/{$filename}", $data);
        } else {
            $file->storeAs('mock_cloudinary', $filename, 'public');
        }

        $appUrl = rtrim(env('APP_URL', 'http://127.0.0.1:8000'), '/');
        
        return [
            'url' => "{$appUrl}/storage/mock_cloudinary/{$filename}",
            'public_id' => "mock_{$filename}",
        ];
    }
}
