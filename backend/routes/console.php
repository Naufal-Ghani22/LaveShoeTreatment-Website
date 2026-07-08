<?php

use App\Models\OrderItemPhoto;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Command to clean up photos older than 7 days
Artisan::command('photos:cleanup', function () {
    $this->info("Menjalankan pembersihan foto kadaluarsa (lebih dari 7 hari)...");

    // Cari foto yang berusia lebih dari 7 hari
    $threshold = now()->subDays(7);
    $expiredPhotos = OrderItemPhoto::where('created_at', '<', $threshold)->get();

    $count = $expiredPhotos->count();
    $this->info("Ditemukan {$count} foto kadaluarsa.");

    foreach ($expiredPhotos as $photo) {
        $this->info("Menghapus foto ID: {$photo->id} (Public ID: {$photo->cloudinary_public_id})");

        // Hapus dari cloud/penyimpanan lokal
        if ($photo->cloudinary_public_id) {
            CloudinaryService::delete($photo->cloudinary_public_id);
        }

        // Hapus record dari database
        $photo->delete();
    }

    $this->info("Pembersihan foto selesai!");
})->purpose('Menghapus foto Before & After yang berumur lebih dari 7 hari dari Cloudinary dan DB');

// Daftarkan ke Scheduler agar berjalan harian
Schedule::command('photos:cleanup')->daily();
