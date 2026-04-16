using JobTracker.Jobs.Api.Contracts;
using JobTracker.Jobs.Application.Jobs.Commands.CancelJob;
using JobTracker.Jobs.Application.Jobs.Commands.CompleteJob;
using JobTracker.Jobs.Application.Jobs.Commands.ScheduleJob;
using JobTracker.Jobs.Application.Jobs.Commands.StartJob;
using JobTracker.Jobs.Application.Jobs.Queries.SearchJobs;
using JobTracker.Shared.Domain.Primitives;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.Jobs.Api.Controllers;

[ApiController]
[Route("api/jobs")]
[Produces("application/json")]
public sealed class JobsController(ISender sender) : ControllerBase
{
  
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateJobRequest request,
        [FromHeader(Name = "X-Organization-Id")] Guid organizationId,
        CancellationToken cancellationToken)
    {
        var command = request.ToCommand(organizationId);
        var result = await sender.Send(command, cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : ToErrorResult(result.Error);
    }

    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Complete(
        Guid id,
        [FromBody] CompleteJobRequest request,
        [FromHeader(Name = "X-Organization-Id")] Guid organizationId,
        CancellationToken cancellationToken)
    {
        var command = new CompleteJobCommand(id, request.SignatureUrl, organizationId);
        var result = await sender.Send(command, cancellationToken);

        return result.IsSuccess ? NoContent() : ToErrorResult(result.Error);
    }

    [HttpPost("{id:guid}/schedule")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Schedule(
        Guid id,
        [FromBody] ScheduleJobRequest request,
        [FromHeader(Name = "X-Organization-Id")] Guid organizationId,
        CancellationToken cancellationToken)
    {
        var command = new ScheduleJobCommand(id, request.ScheduledDate, request.AssigneeId, organizationId);
        var result = await sender.Send(command, cancellationToken);

        return result.IsSuccess ? NoContent() : ToErrorResult(result.Error);
    }

    [HttpPost("{id:guid}/start")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Start(
        Guid id,
        [FromHeader(Name = "X-Organization-Id")] Guid organizationId,
        CancellationToken cancellationToken)
    {
        var command = new StartJobCommand(id, organizationId);
        var result = await sender.Send(command, cancellationToken);

        return result.IsSuccess ? NoContent() : ToErrorResult(result.Error);
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(
        Guid id,
        [FromBody] CancelJobRequest request,
        [FromHeader(Name = "X-Organization-Id")] Guid organizationId,
        CancellationToken cancellationToken)
    {
        var command = new CancelJobCommand(id, request.Reason, organizationId);
        var result = await sender.Send(command, cancellationToken);

        return result.IsSuccess ? NoContent() : ToErrorResult(result.Error);
    }


    [HttpGet]
    [ProducesResponseType(typeof(CursorPageResponse<JobResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] SearchJobsRequest request,
        [FromHeader(Name = "X-Organization-Id")] Guid organizationId,
        CancellationToken cancellationToken)
    {
        var query = request.ToQuery(organizationId);
        var result = await sender.Send(query, cancellationToken);

        return result.IsSuccess
            ? Ok(new CursorPageResponse<JobResponse>(
                result.Value.Items, result.Value.NextCursor, result.Value.HasMore))
            : ToErrorResult(result.Error);
    }

    private IActionResult ToErrorResult(Error error)
    {
        var payload = new { error.Code, error.Message };

        return error.Code.EndsWith("NotFound")
            ? NotFound(payload)
            : BadRequest(payload);
    }
}
