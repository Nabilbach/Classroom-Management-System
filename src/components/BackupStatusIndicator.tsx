import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, CheckCircle, AlertCircle } from 'lucide-react';

interface BackupStatus {
	isRunning: boolean;
	lastBackup: string | null;
	nextBackup: string | null;
	backupCount: number;
}

const BackupStatusIndicator: React.FC = () => {
	const [status, setStatus] = useState<BackupStatus>({
		isRunning: false,
		lastBackup: null,
		nextBackup: null,
		backupCount: 0,
	});
	const [showDetails, setShowDetails] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const checkBackupStatus = async () => {
		try {
			const response = await fetch('http://localhost:4200/api/backup-status');
			if (response.ok) {
				const data = await response.json();
				setStatus(data);
				setIsLoading(false);
			} else {
				setStatus(prev => ({ ...prev, isRunning: false }));
				setIsLoading(false);
			}
		} catch (error) {
			console.error('Failed to check backup status:', error);
			setStatus(prev => ({ ...prev, isRunning: false }));
			setIsLoading(false);
		}
	};

	useEffect(() => {
		checkBackupStatus();
		// Check status every 30 seconds
		const interval = setInterval(checkBackupStatus, 30000);
		return () => clearInterval(interval);
	}, []);

	const formatTime = (dateString: string | null) => {
		if (!dateString) return 'غير متوفر';
		const date = new Date(dateString);
		return date.toLocaleString('ar-SA', {
			hour: '2-digit',
			minute: '2-digit',
			day: '2-digit',
			month: 'short',
		});
	};

	if (isLoading) {
		return (
			<div className="fixed top-4 left-4 z-50">
				<div className="bg-gray-100 rounded-lg p-2 shadow-sm">
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
						<span className="text-xs text-gray-600">جاري الفحص...</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className="fixed top-4 left-4 z-50"
			onMouseEnter={() => setShowDetails(true)}
			onMouseLeave={() => setShowDetails(false)}
		>
			<div
				className={`
					rounded-lg p-2 shadow-lg transition-all duration-300 cursor-pointer
					${status.isRunning ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'}
					${showDetails ? 'w-72' : 'w-auto'}
				`}
			>
				<div className="flex items-center gap-2">
					{status.isRunning ? (
						<>
							<Cloud className="w-4 h-4 text-green-600 animate-pulse" />
							<CheckCircle className="w-3 h-3 text-green-600" />
						</>
					) : (
						<>
							<CloudOff className="w-4 h-4 text-red-600" />
							<AlertCircle className="w-3 h-3 text-red-600" />
						</>
					)}

					<div className="flex-1">
						<div className="flex items-center gap-2">
							<span className={`text-xs font-semibold ${status.isRunning ? 'text-green-700' : 'text-red-700'}`}>النسخ الاحتياطي</span>
							<span className={`text-[10px] px-1.5 py-0.5 rounded-full ${status.isRunning ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
								{status.isRunning ? 'نشط' : 'متوقف'}
							</span>
						</div>

						{showDetails && (
							<div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
								<div className="flex justify-between items-center text-xs">
									<span className="text-gray-600">آخر نسخة:</span>
									<span className="text-gray-800 font-medium">{formatTime(status.lastBackup)}</span>
								</div>

								{status.isRunning && status.nextBackup && (
									<div className="flex justify-between items-center text-xs">
										<span className="text-gray-600">النسخة القادمة:</span>
										<span className="text-gray-800 font-medium">{formatTime(status.nextBackup)}</span>
									</div>
								)}

								<div className="flex justify-between items-center text-xs">
									<span className="text-gray-600">عدد النسخ:</span>
									<span className="text-gray-800 font-medium">{status.backupCount}</span>
								</div>

								{!status.isRunning && (
									<div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">⚠️ خدمة النسخ الاحتياطي غير نشطة</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default BackupStatusIndicator;

