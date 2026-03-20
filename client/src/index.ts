import { JobBoardController } from '$utils/job-board';

window.Webflow ||= [];
window.Webflow.push(async () => {
  // Initialize job board
  const jobBoardContainer = document.querySelector('[dev-role="job-container"]');
  if (jobBoardContainer) {
    const jobBoard = new JobBoardController();
    await jobBoard.init();

    // Expose refresh function globally
    window.refreshJobBoard = () => jobBoard.refresh();
  }
});
