USE msdb;
GO

-------------------------------------------------
-- 1. Crear el JOB
-------------------------------------------------
EXEC sp_add_job
    @job_name = N'BACKUP_DIARIO_ControlCharolas',
    @enabled = 1,
    @description = N'Backup FULL diario de la base de datos ControlCharolas a las 08:30 AM',
    @owner_login_name = N'sa';
GO

-------------------------------------------------
-- 2. Crear el STEP del Job (Backup FULL)
-------------------------------------------------
EXEC sp_add_jobstep
    @job_name = N'BACKUP_DIARIO_ControlCharolas',
    @step_name = N'Backup FULL ControlCharolas',
    @subsystem = N'TSQL',
    @database_name = N'master',
    @command = N'
DECLARE @Ruta NVARCHAR(300);
DECLARE @NombreArchivo NVARCHAR(300);

SET @Ruta = ''D:\BACKUPS_CHAROLAS\'';
SET @NombreArchivo = @Ruta + ''ControlCharolas_'' 
    + CONVERT(VARCHAR(8), GETDATE(), 112) + ''.bak'';

BACKUP DATABASE ControlCharolas
TO DISK = @NombreArchivo
WITH 
    FORMAT,
    INIT,
    NAME = ''Backup FULL ControlCharolas'',
    SKIP,
    NOREWIND,
    NOUNLOAD,
    STATS = 10;
',
    @retry_attempts = 3,
    @retry_interval = 5;
GO

-------------------------------------------------
-- 3. Crear el SCHEDULE (Diario 08:30 AM)
-------------------------------------------------
EXEC sp_add_schedule
    @schedule_name = N'DIARIO_0830_AM',
    @freq_type = 4,              -- Diario
    @freq_interval = 1,          -- Cada día
    @active_start_time = 083000; -- 08:30 AM
GO

-------------------------------------------------
-- 4. Asociar el Schedule al Job
-------------------------------------------------
EXEC sp_attach_schedule
    @job_name = N'BACKUP_DIARIO_ControlCharolas',
    @schedule_name = N'DIARIO_0830_AM';
GO

-------------------------------------------------
-- 5. Asociar el Job al servidor
-------------------------------------------------
EXEC sp_add_jobserver
    @job_name = N'BACKUP_DIARIO_ControlCharolas';
GO
