<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\DbTable;
use App\Models\DbColumn;
use App\Models\DbRelation;
use App\Models\DbEdge;
use App\Models\AiConversation;
use App\Models\ProjectVersion;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    public function store(Request $request)
    {
        $project = Project::create([
            'name' => $request->name ?? 'Untitled Project',
            'description' => $request->description,
            'theme' => $request->theme ?? 'dark'
        ]);

        return response()->json($project);
    }

    public function show($id)
    {
        $project = Project::with([
            'tables.columns',
            'relations',
            'edges',
            'conversations'
        ])->findOrFail($id);

        return response()->json($project);
    }


    public function saveSchema(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        DB::transaction(function () use ($request, $project) {

            // 🔥 CLEAR ALL (SNAPSHOT MODE)
            DbColumn::whereHas('table', function ($q) use ($project) {
                $q->where('project_id', $project->id);
            })->delete();

            DbTable::where('project_id', $project->id)->delete();
            DbEdge::where('project_id', $project->id)->delete();
            DbRelation::where('project_id', $project->id)->delete();

            // ================= SAVE TABLES =================
            foreach ($request->tables as $tableData) {

                $table = DbTable::create([
                    'id' => $tableData['id'], // ✅ PAKAI ID DARI FRONTEND
                    'project_id' => $project->id,
                    'name' => $tableData['name'],
                    'position_x' => $tableData['position']['x'],
                    'position_y' => $tableData['position']['y'],
                ]);

                foreach ($tableData['columns'] as $col) {
                    DbColumn::create([
                        'table_id' => $table->id,
                        'name' => $col['name'],
                        'type' => $col['type'] ?? 'varchar(255)',
                        'is_primary' => $col['primary'] ?? false,
                        'is_unique' => $col['unique'] ?? false,
                        'is_nullable' => $col['nullable'] ?? true,
                    ]);
                }
            }

            // ================= SAVE EDGES =================
            foreach ($request->edges ?? [] as $edge) {

                DbEdge::create([
                    'project_id' => $project->id,
                    'source_table_id' => $edge['source_table_id'],
                    'source_column' => $edge['source_column'],
                    'target_table_id' => $edge['target_table_id'],
                    'target_column' => $edge['target_column'],
                    'label' => $edge['label'] ?? null,
                ]);

                // 🔥 Tentukan child berdasarkan kolom *_id
                $childTableId = null;
                $childColumn  = null;
                $parentTableId = null;
                $parentColumn = null;

                if (str_ends_with($edge['source_column'], '_id')) {
                    $childTableId  = $edge['source_table_id'];
                    $childColumn   = $edge['source_column'];
                    $parentTableId = $edge['target_table_id'];
                    $parentColumn  = $edge['target_column'];
                } elseif (str_ends_with($edge['target_column'], '_id')) {
                    $childTableId  = $edge['target_table_id'];
                    $childColumn   = $edge['target_column'];
                    $parentTableId = $edge['source_table_id'];
                    $parentColumn  = $edge['source_column'];
                }

                if ($childTableId && $childColumn) {
                    DbColumn::where('table_id', $childTableId)
                        ->where('name', $childColumn)
                        ->update([
                            'foreign_table_id' => $parentTableId,
                            'foreign_column'   => 'id', // 🔥 ALWAYS parent id
                        ]);
                }
            }
        });

        return response()->json(['message' => 'Schema saved']);
    }


    public function saveConversation(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        AiConversation::create([
            'project_id' => $project->id,
            'role' => $request->role,
            'content' => $request->content
        ]);

        return response()->json(['message' => 'Conversation saved']);
    }
    public function saveVersion(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $latestVersion = ProjectVersion::where('project_id', $project->id)
            ->max('version_number') ?? 0;

        ProjectVersion::create([
            'project_id' => $project->id,
            'snapshot' => $request->snapshot,
            'version_number' => $latestVersion + 1
        ]);

        return response()->json(['message' => 'Version saved']);
    }
    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        $project->delete();

        return response()->json(['message' => 'Project deleted']);
    }
}
