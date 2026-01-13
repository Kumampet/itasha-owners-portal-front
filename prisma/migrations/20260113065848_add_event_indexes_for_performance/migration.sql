-- CreateIndex
CREATE INDEX `events_event_date_idx` ON `events`(`event_date`);

-- CreateIndex
CREATE INDEX `events_approval_status_idx` ON `events`(`approval_status`);

-- CreateIndex
CREATE INDEX `events_event_date_approval_status_idx` ON `events`(`event_date`, `approval_status`);
